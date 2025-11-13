import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  Shield, 
  MessageSquare, 
  FileText, 
  Users, 
  Settings,
  BookOpen,
  TrendingUp,
  LayoutDashboard,
  Crown,
  CheckSquare,
  Award
} from "lucide-react";

export const Navigation = () => {
  const { toast } = useToast();

  const handleSettings = () => {
    toast({
      title: "הגדרות",
      description: "נפתחו הגדרות המערכת",
    });
  };
  return (
    <nav className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-50" dir="rtl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <div className="text-right">
                <h1 className="text-xl font-bold text-foreground">פק״ל Insight</h1>
                <p className="text-xs text-muted-foreground">מערכת ידע ותובנות</p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center gap-2" dir="ltr">
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/">
                <LayoutDashboard className="h-4 w-4" />
                דשבורד תובנות
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/chat">
                <MessageSquare className="h-4 w-4" />
                צ'אט מנהל
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/knowledge">
                <BookOpen className="h-4 w-4" />
                ניהול ידע
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/units">
                <Users className="h-4 w-4" />
                ניהול משתמשים
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/unit-profiles">
                <Award className="h-4 w-4" />
                מיפויי יחידות
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSettings}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* User Section */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs">
              אדמין יחידה
            </Badge>
            <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">מ</span>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};