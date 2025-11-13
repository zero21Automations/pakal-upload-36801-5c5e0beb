import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BarChart3, 
  FileText, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  RefreshCw, 
  Settings, 
  Download, 
  X,
  GripHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemInsightsWindowProps {
  onClose: () => void;
}

export const SystemInsightsWindow = ({ onClose }: SystemInsightsWindowProps) => {
  const { toast } = useToast();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleAction = (action: string) => {
    toast({
      title: action,
      description: `פעולה: ${action} בוצעה בהצלחה`,
    });
  };

  const mockAnalytics = {
    totalDocuments: 1247,
    pendingApprovals: 8,
    lastUpdate: "לפני 5 דקות",
    topMissingTopics: [
      { topic: 'איך מחזקים לכידות פלוגתית?', count: 47, hasL1: false },
      { topic: 'טיפול בקונפליקטים בצוות', count: 29, hasL1: false },
      { topic: 'ליווי משפחות בזמן שירות', count: 23, hasL1: false },
    ],
    levelMix: { l1Rate: 0.34, l2Rate: 0.45, l3Rate: 0.21 },
    staleDocuments: [
      { title: 'מדריך הדרכה מתקדמת', lastAccessed: '2024-01-10', hits: 0 },
      { title: 'נהלי בטיחות מעודכנים', lastAccessed: '2024-01-15', hits: 2 },
    ],
    flaggedContent: [
      { title: 'מסמך עם מידע רגיש', flagType: 'PII', severity: 'high' as const },
      { title: 'מדריך כפול - גרסה 1', flagType: 'duplicate', severity: 'medium' as const },
    ]
  };

  return (
    <div
      className="fixed bg-background border border-border shadow-2xl rounded-lg w-96 h-[500px] z-50 flex flex-col"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s ease',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Draggable Header */}
      <div
        className="flex items-center justify-between p-3 border-b cursor-move select-none bg-muted/50 rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">תובנות מערכת</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* System Stats */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                סטטיסטיקות מערכת
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>סה״כ מסמכים</span>
                <Badge variant="outline">{mockAnalytics.totalDocuments.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>ממתינים לאישור</span>
                <Badge variant="secondary">{mockAnalytics.pendingApprovals}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>עודכן</span>
                <span className="text-muted-foreground">{mockAnalytics.lastUpdate}</span>
              </div>
            </CardContent>
          </Card>

          {/* Top Missing Topics */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                פערי ידע מובילים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockAnalytics.topMissingTopics.map((topic, index) => (
                <div key={index} className="text-xs space-y-1">
                  <div className="flex items-start justify-between">
                    <span className="text-muted-foreground leading-tight">{topic.topic}</span>
                    <Badge variant="outline" className="text-xs">
                      {topic.count}
                    </Badge>
                  </div>
                  {!topic.hasL1 && (
                    <Badge variant="destructive" className="text-xs">
                      חסר L1
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Flagged Content */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                תוכן מדוגל
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {mockAnalytics.flaggedContent.map((item, index) => (
                <div key={index} className="text-xs space-y-1">
                  <div className="font-medium text-muted-foreground">{item.title}</div>
                  <div className="flex gap-1">
                    <Badge 
                      variant={item.severity === 'high' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {item.flagType}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.severity}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">פעולות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => handleAction('רענון נתונים')}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  רענן
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={() => handleAction('הגדרות')}
                >
                  <Settings className="h-3 w-3 mr-1" />
                  הגדרות
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8 col-span-2"
                  onClick={() => handleAction('ייצוא דוח')}
                >
                  <Download className="h-3 w-3 mr-1" />
                  ייצא דוח מלא
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};