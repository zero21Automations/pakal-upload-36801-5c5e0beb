import { Message, Source } from "@/types/chat";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { User, Bot, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage = ({ message }: ChatMessageProps) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
      
      // Add the italic text
      parts.push(
        <em key={`italic-${match.index}`} className="italic">
          {match[1]}
        </em>
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
    <div 
      className={cn(
        "flex w-full mb-6 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
      dir="rtl"
    >
      <div className={cn("flex max-w-[85%] gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
        {/* Avatar */}
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"
        )}>
          {isUser ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
        </div>

        {/* Message Content */}
        <div className={cn("flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
          {/* Message Bubble */}
          <Card className={cn(
            "shadow-sm border transition-all duration-200 hover:shadow-md",
            isUser 
              ? "bg-primary text-primary-foreground border-primary/20" 
              : "bg-card text-card-foreground hover:bg-muted/30"
          )}>
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
                <Badge
                  key={source.id}
                  variant="outline"
                  className={cn(
                    "text-xs border-r-4 transition-colors hover:bg-muted/50",
                    getSourceBorderColor(source.level)
                  )}
                >
                  <span className="mr-1">{getSourceIcon(source.level)}</span>
                  {source.title}
                  <span className="text-muted-foreground mr-1">({getSourceLabel(source.level)})</span>
                </Badge>
              ))}
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(message.timestamp)}
          </div>
        </div>
      </div>
    </div>
  );
};