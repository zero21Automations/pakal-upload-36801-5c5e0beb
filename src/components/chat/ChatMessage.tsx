import { Message, Source } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { User, Bot, Clock, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      toast({
        title: "הועתק",
        description: "ההודעה הועתקה ללוח",
        duration: 2000,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להעתיק את ההודעה",
        variant: "destructive",
      });
    }
  };

  const getSourceIcon = (level: Source['level']) => {
    switch (level) {
      case 'org-core': return '🟩';
      case 'unit-core': return '🟦';
      case 'L1': case 'L2': case 'L3': return '🟨';
      case 'draft': return '🟪';
      case 'flagged': return '🔴';
      default: return '📄';
    }
  };

  const getSourceLabel = (level: Source['level']) => {
    switch (level) {
      case 'org-core': return 'ליבה ארגוני';
      case 'unit-core': return 'ליבה יחידתי';
      case 'L1': return 'רמה 1';
      case 'L2': return 'רמה 2';
      case 'L3': return 'רמה 3';
      case 'draft': return 'טיוטה';
      case 'flagged': return 'מסומן';
      default: return 'מסמך';
    }
  };

  const getSourceBorderColor = (level: Source['level']) => {
    switch (level) {
      case 'org-core': return 'border-r-success';
      case 'unit-core': return 'border-r-primary';
      case 'L1': case 'L2': case 'L3': return 'border-r-warning';
      case 'draft': return 'border-r-accent';
      case 'flagged': return 'border-r-destructive';
      default: return 'border-r-muted';
    }
  };

  const formatMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Handle headers (### text)
      if (line.startsWith('### ')) {
        const headerText = line.substring(4);
        return (
          <h3 key={index} className="font-bold text-lg mb-2 mt-4 first:mt-0">
            {formatInlineMarkdown(headerText)}
          </h3>
        );
      }
      
      // Handle regular lines with inline formatting
      if (line.trim()) {
        return (
          <p key={index} className="mb-2">
            {formatInlineMarkdown(line)}
          </p>
        );
      }
      
      // Empty lines
      return <br key={index} />;
    });
  };

  const formatInlineMarkdown = (text: string) => {
    const parts = [];
    let currentIndex = 0;
    
    // Find all **text** patterns
    const boldPattern = /\*\*(.*?)\*\*/g;
    let match;
    
    while ((match = boldPattern.exec(text)) !== null) {
      // Add text before the match
      if (match.index > currentIndex) {
        parts.push(text.substring(currentIndex, match.index));
      }
      
      // Add the bold text
      parts.push(
        <strong key={`bold-${match.index}`} className="font-bold">
          {match[1]}
        </strong>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const isUser = message.sender === 'user';

  return (
    <TooltipProvider>
      <div 
        className={cn(
          "group flex w-full mb-6 animate-in slide-in-from-bottom-4 duration-300",
          isUser ? "justify-end" : "justify-start"
        )}
        dir="rtl"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={cn("flex max-w-[85%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
          {/* Avatar */}
          <div className={cn(
            "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 hover:shadow-lg",
            isUser 
              ? "bg-gradient-to-br from-primary to-primary-light text-primary-foreground" 
              : "bg-gradient-to-br from-secondary to-secondary-hover text-secondary-foreground"
          )}>
            {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
          </div>

          {/* Message Content */}
          <div className={cn("flex flex-col gap-2 relative", isUser ? "items-end" : "items-start")}>
            {/* Message Bubble */}
            <Card className={cn(
              "shadow-card border transition-all duration-300 hover:shadow-primary hover:-translate-y-0.5 relative overflow-hidden",
              isUser 
                ? "bg-gradient-to-br from-primary to-primary-hover text-primary-foreground border-primary/20" 
                : "bg-card text-card-foreground hover:bg-muted/30 border-border/50"
            )}>
              {/* Copy Button */}
              <div className={cn(
                "absolute top-2 left-2 opacity-0 transition-opacity duration-200",
                isHovered && "opacity-100",
                isUser ? "right-2 left-auto" : ""
              )}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopy}
                      className={cn(
                        "p-1.5 rounded-md transition-colors",
                        isUser 
                          ? "bg-primary-light/20 hover:bg-primary-light/30 text-primary-foreground"
                          : "bg-muted hover:bg-muted-foreground/10"
                      )}
                    >
                      {copied ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{copied ? "הועתק!" : "העתק הודעה"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <CardContent className="p-4">
                <div className={cn(
                  "prose prose-sm max-w-none",
                  isUser ? "prose-invert" : ""
                )}>
                  {formatMarkdown(message.content)}
                </div>
              </CardContent>
            </Card>

            {/* Sources */}
            {message.sources && message.sources.length > 0 && (
              <div className="flex flex-wrap gap-2 max-w-full">
                {message.sources.map((source) => (
                  <Tooltip key={source.id}>
                    <TooltipTrigger asChild>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs transition-all duration-200 cursor-pointer",
                          "hover:scale-105 hover:shadow-md hover:bg-primary/10 hover:border-primary/30"
                        )}
                      >
                        {source.title}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs max-w-xs">
                        <p className="font-semibold mb-1">{source.title}</p>
                        <p className="text-muted-foreground">מקור מידע</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            )}

            {/* Timestamp - Show on hover */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={cn(
                  "flex items-center gap-1 text-xs transition-opacity duration-200",
                  isHovered ? "text-muted-foreground" : "text-muted-foreground/60"
                )}>
                  <Clock className="h-3 w-3" />
                  {formatTime(message.timestamp)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{message.timestamp.toLocaleDateString('he-IL')} {formatTime(message.timestamp)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};