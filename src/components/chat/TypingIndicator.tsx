import { Bot, Search, Brain, FileSearch, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
  state?: 'typing' | 'searching' | 'analyzing' | 'generating';
}

const stateConfig = {
  typing: {
    text: "כותב",
    icon: Bot,
  },
  searching: {
    text: "מחפש במקורות",
    icon: Search,
  },
  analyzing: {
    text: "מנתח תוכן",
    icon: Brain,
  },
  generating: {
    text: "מייצר תשובה",
    icon: Sparkles,
  },
};

export const TypingIndicator = ({ className, state = 'typing' }: TypingIndicatorProps) => {
  const config = stateConfig[state];
  const StateIcon = config.icon;

  return (
    <div className={cn("flex w-full mb-6 justify-start animate-fade-in", className)} dir="rtl">
      <div className="flex max-w-[85%] gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-secondary text-secondary-foreground shadow-md">
          <Bot className="h-5 w-5" />
        </div>

        {/* Typing Bubble */}
        <Card className="shadow-sm border bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <StateIcon className="h-4 w-4 text-primary animate-pulse" />
              <span className="text-muted-foreground">{config.text}</span>
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};