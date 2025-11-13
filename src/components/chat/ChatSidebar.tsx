import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Archive, 
  Flag,
  RefreshCw,
  Download,
  Settings,
  ChevronRight,
  Eye,
  Users,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ChatSidebarProps {
  className?: string;
}

const mockAnalytics = {
  topMissingTopics: [
    { topic: 'איך מחזקים לכידות פלוגתית?', count: 47, hasL1: false },
    { topic: 'טיפול בקונפליקטים בצוות', count: 29, hasL1: false },
    { topic: 'ליווי משפחות בזמן שירות', count: 23, hasL1: false },
  ],
  levelMix: { l1Rate: 0.34, l2Rate: 0.45, l3Rate: 0.21 },
  staleDocuments: [
    { id: 'doc_123', title: 'מדריך הדרכה מתקדמת', level: 'L2', lastAccess: '2024-01-10' },
    { id: 'doc_124', title: 'נהלי בטיחות מעודכנים', level: 'L3', lastAccess: '2024-01-15' },
  ],
  flaggedContent: [
    { id: 'doc_200', title: 'מסמך עם מידע רגיש', flagType: 'PII', severity: 'high' as const },
    { id: 'doc_201', title: 'מדריך כפול - גרסה 1', flagType: 'duplicate', severity: 'medium' as const },
  ]
};

export const ChatSidebar = ({ className }: ChatSidebarProps) => {
  const { toast } = useToast();

  const handleAction = (action: string) => {
    toast({
      title: "פעולה התבצעה",
      description: `${action} בוצע בהצלחה`,
    });
  };

  return (
    <div className={cn("w-80 border-l bg-background", className)}>
      <ScrollArea className="h-full">
        <div className="p-4 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">תובנות מערכת</h2>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAction("רענון נתונים")}
                className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => handleAction("הגדרות")}
                className="h-8 w-8"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                סטטיסטיקות מהירות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">1,247</div>
                  <div className="text-xs text-muted-foreground">מסמכים כולל</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-success">89%</div>
                  <div className="text-xs text-muted-foreground">שיעור מאושרים</div>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>רמה 1</span>
                  <span className="font-medium">{Math.round(mockAnalytics.levelMix.l1Rate * 100)}%</span>
                </div>
                <Progress value={mockAnalytics.levelMix.l1Rate * 100} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>רמה 2</span>
                  <span className="font-medium">{Math.round(mockAnalytics.levelMix.l2Rate * 100)}%</span>
                </div>
                <Progress value={mockAnalytics.levelMix.l2Rate * 100} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>רמה 3</span>
                  <span className="font-medium">{Math.round(mockAnalytics.levelMix.l3Rate * 100)}%</span>
                </div>
                <Progress value={mockAnalytics.levelMix.l3Rate * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Top Missing Topics */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Target className="h-4 w-4" />
                פערי ידע מובילים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAnalytics.topMissingTopics.map((topic, index) => (
                <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <Badge variant="secondary" className="text-xs mt-1">
                    {topic.count}
                  </Badge>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-tight">{topic.topic}</p>
                    <div className="flex items-center gap-2">
                      {!topic.hasL1 && (
                        <Badge variant="destructive" className="text-xs">
                          חסר L1
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleAction("צפייה בכל הפערים")}
              >
                <Eye className="h-4 w-4 ml-1" />
                צפה בהכל
              </Button>
            </CardContent>
          </Card>

          {/* Flagged Content */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                תוכן מסומן
                <Badge variant="secondary" className="text-xs">
                  {mockAnalytics.flaggedContent.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAnalytics.flaggedContent.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2",
                    item.severity === 'high' ? 'bg-destructive' : 
                    item.severity === 'medium' ? 'bg-warning' : 'bg-muted'
                  )} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-tight">{item.title}</p>
                    <Badge variant="outline" className="text-xs">
                      {item.flagType}
                    </Badge>
                  </div>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => handleAction("ניהול תוכן מסומן")}
              >
                <Flag className="h-4 w-4 ml-1" />
                נהל הכל
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                פעולות מהירות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleAction("ייצוא דוח תובנות")}
              >
                <Download className="h-4 w-4 ml-1" />
                ייצא דוח תובנות
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleAction("ניתוח מסמכים נטושים")}
              >
                <Archive className="h-4 w-4 ml-1" />
                מסמכים נטושים
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleAction("סימולציית אישורים")}
              >
                <CheckCircle className="h-4 w-4 ml-1" />
                סימולציית אישורים
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => handleAction("ניהול צוותים")}
              >
                <Users className="h-4 w-4 ml-1" />
                ניהול צוותים
              </Button>
            </CardContent>
          </Card>

          {/* Last Updated */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            עודכן לפני 5 דקות
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};