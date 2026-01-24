import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RoleSelector } from "@/components/RoleSelector";
import { useUserRole } from "@/hooks/useUserRole";
import { useConversation } from "@/hooks/useConversation";
import { ContentFilters, ContentFilterState, defaultContentFilters } from "@/components/chat/ContentFilters";
import { EnhancedCitationCard } from "@/components/chat/EnhancedCitationCard";
import { ConversationsList } from "@/components/chat/ConversationsList";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { ChatInput } from "@/components/chat/ChatInput";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { ROLE_LABELS } from "@/types/roles";
import { ChunkMetadata } from "@/types/content";
import { Message, Source } from "@/types/chat";
import { 
  MessageSquare, 
  Bot,
  User,
  Sparkles,
  TrendingUp,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
  ArrowDown
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  citations?: Citation[];
  metadata?: {
    model?: string;
    mode?: string;
    search_results_count?: number;
    has_l1_content?: boolean;
    level_distribution?: {
      L1: number;
      L2: number;
      L3: number;
    };
  };
}

interface Citation {
  source_id: string;
  chunk_id: string;
  title: string;
  level: number;
  confidence: number;
  excerpt: string;
  metadata?: ChunkMetadata;
}

const Chat = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile, role, loading: roleLoading, needsOnboarding } = useUserRole();
  const { 
    currentConversationId, 
    messages, 
    loading: conversationLoading,
    setMessages,
    loadConversation, 
    createConversation, 
    saveMessage,
    startNewConversation 
  } = useConversation();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showConversations, setShowConversations] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showContentFilters, setShowContentFilters] = useState(false);
  const [contentFilters, setContentFilters] = useState<ContentFilterState>(defaultContentFilters);
  const [levelWeights, setLevelWeights] = useState({
    Core: 0.50,
    L1: 0.20,
    L2: 0.08,
    L3: 0.00
  });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [typingState, setTypingState] = useState<'typing' | 'searching' | 'analyzing' | 'generating'>('searching');
  const [lastUserMessageIndex, setLastUserMessageIndex] = useState<number | null>(null);
  const [resolvedOrgId, setResolvedOrgId] = useState<string | null>(null);

  // Resolve actual org_id from chunks table on mount
  useEffect(() => {
    const resolveOrgId = async () => {
      // First try from profile
      if (profile?.org_id) {
        setResolvedOrgId(profile.org_id);
        return;
      }
      
      // Fallback: query the chunks table to find the actual org_id in use
      const { data: chunks } = await supabase
        .from('chunks')
        .select('org_id')
        .limit(1);
      
      if (chunks && chunks.length > 0 && chunks[0].org_id) {
        setResolvedOrgId(chunks[0].org_id);
        console.log('Resolved org_id from chunks:', chunks[0].org_id);
      } else {
        // Ultimate fallback
        setResolvedOrgId('default-org');
      }
    };

    resolveOrgId();
  }, [profile?.org_id]);

  // Helper to convert numeric level to Source level type
  const mapLevelToSourceLevel = (level: number): Source['level'] => {
    switch (level) {
      case 0: return 'org-core';
      case 1: return 'L1';
      case 2: return 'L2';
      case 3: return 'L3';
      default: return 'L1';
    }
  };

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle scroll to show/hide scroll button
  useEffect(() => {
    const scrollArea = scrollAreaRef.current;
    if (!scrollArea) return;

    const handleScroll = () => {
      const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
      if (!viewport) return;

      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && messages.length > 0);
    };

    const viewport = scrollArea.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.addEventListener('scroll', handleScroll);
      return () => viewport.removeEventListener('scroll', handleScroll);
    }
  }, [messages.length]);

  useEffect(() => {
    if (!roleLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [roleLoading, needsOnboarding]);

  useEffect(() => {
    if (!currentConversationId && messages.length === 0) {
      startNewConversation();
    }
  }, [currentConversationId, messages.length, startNewConversation]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageContent = inputValue.trim();
    
    // Create conversation if needed
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = await createConversation(messageContent);
      if (!conversationId) return;
    }

    const tempUserMessageId = `temp-${Date.now()}`;
    const userMessage: ChatMessage = {
      id: tempUserMessageId,
      content: messageContent,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    // Save user message to database and update with real ID
    const savedUserMessageId = await saveMessage({
      content: messageContent,
      isUser: true
    }, conversationId);

    // Update the temp ID to the real database ID to prevent duplicates from realtime subscription
    if (savedUserMessageId) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempUserMessageId 
          ? { ...msg, id: savedUserMessageId }
          : msg
      ));
    }

    // Create placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      content: '',
      isUser: false,
      timestamp: new Date(),
      citations: [],
      metadata: {}
    };
    setMessages(prev => [...prev, assistantMessage]);

    // Track for regeneration
    setLastUserMessageIndex(messages.length);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/insights-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            message: messageContent,
            org_id: resolvedOrgId || profile?.org_id || 'default-org',
            unit_id: profile?.unit_id || undefined,
            user_id: user?.id,
            mode: 'insights',
            level_weights: levelWeights,
            user_role: role,
            content_filters: contentFilters
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Failed to initialize reader');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let receivedMetadata: any = null;
      let fullContent = '';

      // Single loop to process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'metadata') {
                receivedMetadata = parsed;
                setTypingState('analyzing');
              } else if (parsed.type === 'content') {
                fullContent += parsed.content;
                setTypingState('generating');
                // Update message in real-time with accumulated content
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              } else if (parsed.type === 'done') {
                // Finalize message with metadata and citations
                const finalMessage = {
                  ...assistantMessage,
                  content: fullContent,
                  citations: receivedMetadata?.citations || [],
                  metadata: receivedMetadata?.metadata || {}
                };
                
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId ? finalMessage : msg
                ));

                // Save the complete assistant message to database
                const savedMessageId = await saveMessage({
                  content: fullContent,
                  isUser: false,
                  citations: receivedMetadata?.citations || [],
                  metadata: receivedMetadata?.metadata || {}
                });

                // Update the message ID to match the database ID to prevent duplicates from real-time subscription
                if (savedMessageId) {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, id: savedMessageId }
                      : msg
                  ));
                }

                // Show success toast if L1 content was found
                if (receivedMetadata?.metadata?.has_l1_content) {
                  toast({
                    title: "תוכן L1 נמצא",
                    description: "התשובה מבוססת על תוכן ליבה של פק״ל",
                  });
                }
              }
            } catch (e) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Remove the placeholder message
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
      toast({
        title: "שגיאה",
        description: "שגיאה בשליחת ההודעה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateMessage = async (messageIndex: number) => {
    // Find the user message before this bot message
    const userMessage = messages[messageIndex - 1];
    if (!userMessage || !userMessage.isUser) return;

    // Remove all messages after the user message
    const newMessages = messages.slice(0, messageIndex);
    setMessages(newMessages);

    // Resend with the user's original message
    setInputValue(userMessage.content);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (message: string) => {
    setInputValue(message);
    // Trigger send automatically
    setTimeout(() => {
      const event = { target: { value: message } };
      setInputValue(message);
      handleSendMessage();
    }, 100);
  };

  const handleViewSource = (sourceId: string) => {
    // Navigate to knowledge management page with the document selected
    navigate(`/knowledge-management?doc=${sourceId}`);
    toast({
      title: "פתיחת מקור",
      description: "מעביר לניהול ידע לצפייה במסמך",
    });
  };

  const getMetadataDisplay = (metadata: ChatMessage['metadata']) => {
    if (!metadata) return null;

    const items = [];
    
    if (metadata.search_results_count !== undefined) {
      items.push(`${metadata.search_results_count} מקורות נמצאו`);
    }
    
    if (metadata.level_distribution) {
      const levelDist = metadata.level_distribution as any;
      if (levelDist.Core > 0) items.push(`מסמך ליבה: ${levelDist.Core}`);
      if (levelDist.L1 > 0) items.push(`רמה 1: ${levelDist.L1}`);
      if (levelDist.L2 > 0) items.push(`רמה 2: ${levelDist.L2}`);
      if (levelDist.L3 > 0) items.push(`רמה 3: ${levelDist.L3}`);
    }

    return items.length > 0 ? items.join(' • ') : null;
  };

  if (showOnboarding) {
    return <RoleSelector onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6" dir="rtl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">צ'אט פק"ל</h1>
            </div>
            <p className="text-muted-foreground">
              {role ? ROLE_LABELS[role] : 'העוזר הדיגיטלי למערכת הידע של פק״ל'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {role && (
              <Badge variant="secondary" className="gap-1">
                <User className="h-3 w-3" />
                {ROLE_LABELS[role]}
              </Badge>
            )}
            <Badge variant="outline" className="gap-1">
              <Bot className="h-3 w-3" />
              מצב תובנות
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConversations(!showConversations)}
            >
              {showConversations ? (
                <>
                  <PanelLeftClose className="h-4 w-4 ml-1" />
                  הסתר היסטוריה
                </>
              ) : (
                <>
                  <PanelLeft className="h-4 w-4 ml-1" />
                  הצג היסטוריה
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 ml-1" />
              רמות
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContentFilters(!showContentFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 ml-1" />
              סינון תוכן
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCitations(!showCitations)}
            >
              <FileSearch className="h-4 w-4 ml-1" />
              {showCitations ? 'הסתר' : 'הצג'} מקורות
            </Button>
          </div>
        </div>

        {showFilters && (
          <Card className="mb-6 p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">עדיפות רמות מסמכים</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLevelWeights({ Core: 0.50, L1: 0.20, L2: 0.08, L3: 0.00 })}
                  >
                    ברירת מחדל
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLevelWeights({ Core: 0.30, L1: 0.30, L2: 0.30, L3: 0.10 })}
                  >
                    איזון שווה
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">מסמך ליבה (Core)</label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {levelWeights.Core.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    value={[levelWeights.Core]}
                    min={0}
                    max={1}
                    step={0.01}
                    onValueChange={([value]) => setLevelWeights(prev => ({ ...prev, Core: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">רמה 1 (L1)</label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {levelWeights.L1.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    value={[levelWeights.L1]}
                    min={0}
                    max={0.5}
                    step={0.01}
                    onValueChange={([value]) => setLevelWeights(prev => ({ ...prev, L1: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">רמה 2 (L2)</label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {levelWeights.L2.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    value={[levelWeights.L2]}
                    min={0}
                    max={0.3}
                    step={0.01}
                    onValueChange={([value]) => setLevelWeights(prev => ({ ...prev, L2: value }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">רמה 3 (L3)</label>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {levelWeights.L3.toFixed(2)}
                    </Badge>
                  </div>
                  <Slider
                    value={[levelWeights.L3]}
                    min={0}
                    max={0.2}
                    step={0.01}
                    onValueChange={([value]) => setLevelWeights(prev => ({ ...prev, L3: value }))}
                  />
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                <span className="font-medium">משמעות:</span> ערכים גבוהים יותר נותנים עדיפות למסמכים מרמה זו בתוצאות החיפוש
              </div>
            </div>
          </Card>
        )}

        {showContentFilters && (
          <div className="mb-6">
            <ContentFilters
              currentFilters={contentFilters}
              onFiltersChange={setContentFilters}
            />
          </div>
        )}


        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Conversations Sidebar */}
          {showConversations && (
            <div className="lg:col-span-3">
              <ConversationsList
                currentConversationId={currentConversationId}
                onConversationSelect={loadConversation}
                onNewConversation={startNewConversation}
              />
            </div>
          )}

          {/* Main Content */}
          <div className={showConversations ? "lg:col-span-9" : "lg:col-span-12"}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-8rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  צ'אט תובנות פק״ל
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden relative">
                <ScrollArea className="flex-1 max-h-full p-4" ref={scrollAreaRef} dir="rtl">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <ChatMessageComponent
                        key={message.id}
                        message={{
                          id: message.id,
                          content: message.content,
                          sender: message.isUser ? 'user' : 'bot',
                          timestamp: message.timestamp,
                          sources: (message.citations || []).map(c => ({
                            id: c.source_id,
                            title: c.title,
                            level: mapLevelToSourceLevel(c.level),
                            status: 'approved' as const
                          }))
                        }}
                        onRegenerate={!message.isUser && index > 0 && messages[index - 1]?.isUser
                          ? () => handleRegenerateMessage(index)
                          : undefined
                        }
                      />
                    ))}
                    
                    {isLoading && (
                      <TypingIndicator state={typingState} />
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                {/* Scroll to Bottom Button */}
                {showScrollButton && (
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-20 right-8 rounded-full shadow-primary hover:shadow-command transition-all duration-300 animate-in fade-in zoom-in"
                    onClick={scrollToBottom}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                )}
                
                <Separator />
                
                <div className="p-4 space-y-4">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSend={handleSendMessage}
                    disabled={isLoading}
                    mode="insights"
                  />
                  
                  {/* Role-based Suggested Questions */}
                  {role && messages.length <= 1 && (
                    <SuggestedQuestions 
                      role={role} 
                      onQuestionClick={handleQuickAction}
                    />
                  )}
                  
                  {/* Quick Actions - Fallback when no role selected */}
                  {!role && messages.length <= 1 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4" />
                        <span>פעולות מהירות:</span>
                      </div>
                    <div className="grid grid-cols-2 gap-2" dir="rtl">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1 text-xs"
                        onClick={() => handleQuickAction('הראה לי פערי ידע בחודש האחרון')}
                        disabled={isLoading}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>פערי ידע</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1 text-xs"
                        onClick={() => handleQuickAction('נתח שימוש במסמכים')}
                        disabled={isLoading}
                      >
                        <FileSearch className="h-4 w-4" />
                        <span>ניתוח שימוש</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1 text-xs"
                        onClick={() => handleQuickAction('מה השפעת אישור הטיוטות הממתינות?')}
                        disabled={isLoading}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>השפעת אישורים</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-12 flex flex-col gap-1 text-xs"
                        onClick={() => handleQuickAction('זהה סתירות בין מסמכי ליבה')}
                        disabled={isLoading}
                      >
                        <AlertCircle className="h-4 w-4" />
                        <span>זיהוי סתירות</span>
                      </Button>
                    </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Citations Sidebar */}
          {showCitations && (
            <div className="lg:col-span-1">
              <Card className="h-[700px] flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileSearch className="h-5 w-5 text-primary" />
                    מקורות והפניות
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 p-0">
                  <ScrollArea className="h-full p-4" dir="rtl">
                    {(() => {
                      const lastMessage = messages[messages.length - 1];
                      const citations = !lastMessage?.isUser ? lastMessage?.citations : [];
                      
                      if (!citations || citations.length === 0) {
                        return (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileSearch className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium mb-2">אין מקורות זמינים</h3>
                            <p className="text-sm">מקורות יופיעו כאן עבור תשובות שמבוססות על מסמכים</p>
                          </div>
                        );
                      }
                      
                      return (
                        <div className="space-y-3">
                          <div className="text-sm font-medium mb-4">
                            מקורות לתשובה האחרונה ({citations.length}):
                          </div>
                          {citations.map((citation, index) => (
                            <EnhancedCitationCard
                              key={`${citation.source_id}-${index}`}
                              citation={citation}
                              onViewSource={handleViewSource}
                            />
                          ))}
                        </div>
                      );
                    })()}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;