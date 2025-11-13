import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Paperclip, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  mode: 'user' | 'sandbox' | 'insights';
}

const quickActions = {
  insights: [
    "ניתח פערי ידע",
    "מסמכים לא בשימוש",
    "השפעת אישור טיוטות"
  ],
  sandbox: [
    "בדוק כל המקורות",
    "כלול טיוטות",
    "הצג התנגשויות"
  ],
  user: [
    "מדריך מנהיגות",
    "חיזוק לכידות",
    "קליטת מפקדים"
  ]
};

export const ChatInput = ({ value, onChange, onSend, disabled, mode }: ChatInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      onSend();
    }
  };

  const handleQuickAction = (action: string) => {
    onChange(action);
    textareaRef.current?.focus();
  };

  const canSend = value.trim().length > 0 && !disabled;

  return (
    <div className="space-y-3">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 justify-center">
        {quickActions[mode].map((action) => (
          <Badge
            key={action}
            variant="secondary"
            className="cursor-pointer transition-all hover:bg-secondary/80 hover:scale-105"
            onClick={() => handleQuickAction(action)}
          >
            <Zap className="h-3 w-3 ml-1" />
            {action}
          </Badge>
        ))}
      </div>

      {/* Input Area */}
      <Card className={cn(
        "transition-all duration-200",
        isFocused ? "ring-2 ring-ring shadow-lg" : "shadow-sm"
      )}>
        <CardContent className="p-4">
          <div className="flex gap-3 items-end">
            {/* Textarea */}
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={mode === 'insights' ? "שאל על תובנות וניתוחים..." : 
                           mode === 'sandbox' ? "נסה שאלות עם כל המקורות..." : 
                           "שאל את עוזר המנהלים..."}
                className="min-h-[44px] max-h-[120px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base"
                disabled={disabled}
                dir="rtl"
              />
              {/* Character count for long messages */}
              {value.length > 200 && (
                <div className="absolute bottom-1 left-1 text-xs text-muted-foreground">
                  {value.length}/1000
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                disabled={disabled}
                title="צרף קובץ (בקרוב)"
              >
                <Paperclip className="h-4 w-4" />
              </Button>

              <Button
                onClick={onSend}
                disabled={!canSend}
                size="icon"
                className={cn(
                  "transition-all duration-200",
                  canSend ? "bg-primary hover:bg-primary-hover shadow-primary" : ""
                )}
                title="שלח הודעה (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};