import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Settings, 
  BarChart3, 
  User, 
  Bot, 
  TestTube, 
  TrendingUp,
  FileText,
  Clock,
  MessageSquare,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatModeHeaderProps {
  mode: 'insights';
  onModeChange: (mode: 'insights') => void;
  onSettingsClick: () => void;
  stats?: {
    totalDocuments: number;
    pendingApprovals: number;
    lastUpdate: string;
  };
}

const modeConfig = {
  insights: {
    icon: MessageSquare,
    label: "פק״ל - מאגר הידע",
    color: "text-primary",
    bgColor: "bg-primary/10",
    description: "שאל אותי על מנהיגות, לכידות ועבודת מטה"
  }
};

export const ChatModeHeader = ({ 
  mode, 
  onModeChange, 
  onSettingsClick,
  stats = {
    totalDocuments: 1247,
    pendingApprovals: 8,
    lastUpdate: "לפני 5 דקות"
  }
}: ChatModeHeaderProps) => {
  const currentMode = modeConfig[mode];
  const CurrentIcon = currentMode.icon;

  return (
    <div className="space-y-4 pb-4 border-b">
      {/* Main Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">פק״ל - מאגר הידע</h1>
            <p className="text-sm text-muted-foreground">שאל אותי על מנהיגות, לכידות ועבודת מטה</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="hover:bg-muted"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

    </div>
  );
};