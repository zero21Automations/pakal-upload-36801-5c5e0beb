import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CitationCard from "@/components/CitationCard";
import { RoleSelector } from "@/components/RoleSelector";
import { useUserRole } from "@/hooks/useUserRole";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { CopyPasteActions } from "@/components/chat/CopyPasteActions";
import { ROLE_LABELS } from "@/types/roles";
import { 
  Send, 
  MessageSquare, 
  Bot,
  User,
  Sparkles,
  TrendingUp,
  FileSearch,
  AlertCircle,
  CheckCircle2,
  SlidersHorizontal
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
}

const Chat = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, role, loading: roleLoading, needsOnboarding } = useUserRole();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'שלום! אני העוזר הדיגיטלי של מערכת הידע של פק״ל.\n\nאני יכול לענות על שאלות בהתבסס על המסמכים והתוכן שהועלו למערכת.\n\nהמערכת כוללת:\n• מסמך ליבה (רמה 0) - התוכן הרשמי של פק״ל\n• תוכן L1 - תוכן ליבה נוסף\n• תוכן L2 - כלים והדרכות מעשיות\n• תוכן L3 - מחקרים והקשר רחב\n\nאיך אני יכול לעזור לך היום?',
      isUser: false,
      timestamp: new Date(),
      metadata: {
        mode: 'knowledge'
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCitations, setShowCitations] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [levelWeights, setLevelWeights] = useState({
    Core: 0.50,
    L1: 0.20,
    L2: 0.08,
    L3: 0.00
  });

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (!roleLoading && needsOnboarding) {
      setShowOnboarding(true);
    }
  }, [roleLoading, needsOnboarding]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue('');
    setIsLoading(true);

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
            org_id: user?.id || 'temp-org-id',
            unit_id: 'temp-unit-id',
            mode: 'knowledge',
            level_weights: levelWeights
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';
      let fullContent = '';
      let receivedMetadata: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'metadata') {
                receivedMetadata = parsed;
              } else if (parsed.type === 'content') {
                fullContent += parsed.content;
                // Update message in real-time
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                ));
              } else if (parsed.type === 'done') {
                // Finalize message with metadata and citations
                setMessages(prev => prev.map(msg => 
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: fullContent,
                        citations: receivedMetadata?.citations || [],
                        metadata: receivedMetadata?.metadata || {}
                      }
                    : msg
                ));

                // Show success toast if L1 content was found
                if (receivedMetadata?.metadata?.has_l1_content) {
                  toast({
                    title: "תוכן L1 נמצא",
                    description: "התשובה מבוססת על תוכן ליבה של פק״ל",
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
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
    toast({
      title: "פתיחת מקור",
      description: `פותח מסמך ${sourceId}`,
    });
    // In production, navigate to document viewer
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
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4 ml-1" />
              סינון
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Area */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-12rem)] flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  צ'אט תובנות פק״ל
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                <ScrollArea className="flex-1 max-h-full p-4" ref={scrollAreaRef} dir="rtl">
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div key={message.id} className={`flex gap-3 ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                        {!message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                        
                        <div className="flex-1 max-w-[80%]">
                          <div className={`rounded-lg p-3 ${
                            message.isUser 
                              ? 'bg-primary text-primary-foreground ml-auto' 
                              : 'bg-muted mr-auto'
                          }`}>
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                          
                          {!message.isUser && message.metadata && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {message.metadata.has_l1_content && (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-3 w-3" />
                                  תוכן L1
                                </div>
                              )}
                              
                              {!message.metadata.has_l1_content && message.metadata.search_results_count === 0 && (
                                <div className="flex items-center gap-1 text-amber-600">
                                  <AlertCircle className="h-3 w-3" />
                                  אין מקורות
                                </div>
                              )}
                              
                              {getMetadataDisplay(message.metadata) && (
                                <>
                                  <span>•</span>
                                  <span>{getMetadataDisplay(message.metadata)}</span>
                                </>
                              )}
                            </div>
                          )}
                          
                          {!message.isUser && (
                            <CopyPasteActions content={message.content} />
                          )}
                          
                          <div className={`text-xs text-muted-foreground mt-1 ${message.isUser ? 'text-left' : 'text-right'}`}>
                            {message.timestamp.toLocaleTimeString('he-IL', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>

                        {message.isUser && (
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                            <User className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <div className="bg-muted rounded-lg p-3">
                          <div className="flex items-center gap-2">
                            <div className="animate-pulse flex space-x-1">
                              <div className="rounded-full bg-primary h-2 w-2"></div>
                              <div className="rounded-full bg-primary h-2 w-2 animate-pulse delay-75"></div>
                              <div className="rounded-full bg-primary h-2 w-2 animate-pulse delay-150"></div>
                            </div>
                            <span className="text-sm text-muted-foreground">מחפש במאגר הידע...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                
                <Separator />
                
                <div className="p-4 space-y-4">
                  {/* Input Area */}
                  <div className="flex gap-2" dir="rtl">
                    <Input
                      placeholder="שאל שאלה..."
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      size="icon"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Suggested Questions - Role-based */}
                  <SuggestedQuestions 
                    role={role} 
                    onQuestionClick={handleQuickAction}
                  />
                  
                  {/* Quick Actions - Fallback for managers */}
                  {!role && (
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
                  
                  {role && (
                    <div className="text-xs text-muted-foreground text-center">
                      או הקלד שאלה מותאמת אישית למעלה
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
                            <CitationCard
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
  );
};

export default Chat;