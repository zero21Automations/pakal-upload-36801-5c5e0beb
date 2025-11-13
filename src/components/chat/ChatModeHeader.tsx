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
  MessageSquare
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
    label: "צ'אט מנהל",
    color: "text-success",
    bgColor: "bg-success/10",
    description: "כלים אנליטיים מתקדמים לניהול ידע"
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
          <div>
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">צ׳אט מנהל</h1>
            </div>
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