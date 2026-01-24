import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Send, Paperclip, Zap, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  mode: 'user' | 'sandbox' | 'insights';
}

const MAX_LENGTH = 2000;

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
  const [showValidation, setShowValidation] = useState(false);

  // Auto-resize textarea with smooth transition
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      if (canSend) {
        onSend();
      } else {
        setShowValidation(true);
        setTimeout(() => setShowValidation(false), 2000);
      }
    }
  };

  const handleQuickAction = (action: string) => {
    onChange(action);
    textareaRef.current?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= MAX_LENGTH) {
      onChange(newValue);
      setShowValidation(false);
    }
  };

  const charCount = value.length;
  const isNearLimit = charCount > MAX_LENGTH * 0.8;
  const isAtLimit = charCount >= MAX_LENGTH;
  const canSend = value.trim().length > 0 && !disabled && !isAtLimit;
  
  const getCharCountColor = () => {
    if (isAtLimit) return "text-destructive";
    if (isNearLimit) return "text-warning";
    return "text-muted-foreground";
  };

  return (
    <div className="space-y-3">
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
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={mode === 'insights' ? "שאל על תובנות וניתוחים..." : 
                           mode === 'sandbox' ? "נסה שאלות עם כל המקורות..." : 
                           "שאל את עוזר המנהלים..."}
                className={cn(
                  "min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-base transition-all",
                  isAtLimit && "text-destructive"
                )}
                disabled={disabled}
                dir="rtl"
              />
              
              {/* Character counter - always visible when typing */}
              {charCount > 0 && (
                <div className={cn(
                  "absolute bottom-1 left-1 text-xs font-medium transition-colors duration-200 flex items-center gap-1",
                  getCharCountColor()
                )}>
                  {isAtLimit && <AlertCircle className="h-3 w-3" />}
                  <span>{charCount}/{MAX_LENGTH}</span>
                </div>
              )}
              
              {/* Validation feedback */}
              {showValidation && !canSend && (
                <div className="absolute -top-8 left-0 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded animate-fade-in">
                  {value.trim().length === 0 ? "נא להזין הודעה" : "הודעה ארוכה מדי"}
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