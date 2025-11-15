import { useState, useRef, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import CitationCard from "@/components/CitationCard";
import { 
  Send, 
  MessageSquare, 
  Bot,
  User,
  Sparkles,
  TrendingUp,
  FileSearch,
  AlertCircle,
  CheckCircle2
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
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'שלום! אני העוזר הדיגיטלי של מערכת פק״ל. אני כאן לעזור לך עם תובנות על המערכת, ניתוח פערי ידע, ובחינת השפעת שינויים. איך אני יכול לעזור?',
      isUser: false,
      timestamp: new Date(),
      metadata: {
        mode: 'insights'
      }
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCitations, setShowCitations] = useState(true);

  // Auto-scroll to bottom when new messages are added
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('insights-chat', {
        body: { 
          message: userMessage.content,
          org_id: 'temp-org-id', // In production, get from auth
          unit_id: 'temp-unit-id',
          mode: 'insights'
        },
      });

      if (error) throw error;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: data.answer,
        isUser: false,
        timestamp: new Date(),
        citations: data.citations || [],
        metadata: data.metadata || {}
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Show success toast if L1 content was found
      if (data.metadata?.has_l1_content) {
        toast({
          title: "תוכן L1 נמצא",
          description: "התשובה מבוססת על תוכן ליבה של פק״ל",
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "שגיאה",
        description: "שגיאה בשליחת ההודעה",
        variant: "destructive",
      });
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: 'מצטער, אירעה שגיאה. אנא נסה שוב.',
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6" dir="rtl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">סימולטור צ'אט - תובנות מנהל</h1>
            </div>
            <p className="text-muted-foreground">
              צ'אט מתקדם לניתוח תובנות, פערי ידע והשפעת שינויים במערכת
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Bot className="h-3 w-3" />
              מצב תובנות
            </Badge>
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
                      placeholder="שאל שאלה על תובנות המערכת..."
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
                  
                  {/* Quick Actions */}
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
                  
                  <div className="text-xs text-muted-foreground text-center">
                    או הקלד שאלה מותאמת אישית למעלה
                  </div>
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