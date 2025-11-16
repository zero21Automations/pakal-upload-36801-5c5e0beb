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
  analytics: {
    totalDocuments: number;
    pendingApprovals: number;
    lastUpdate: string;
    levelDistribution: {
      core: number;
      l1: number;
      l2: number;
      l3: number;
    };
  };
}

export const SystemInsightsWindow = ({ onClose, analytics }: SystemInsightsWindowProps) => {
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

  const totalDocs = analytics.totalDocuments;
  const l1Percentage = totalDocs > 0 ? (analytics.levelDistribution.l1 / totalDocs) * 100 : 0;
  const l2Percentage = totalDocs > 0 ? (analytics.levelDistribution.l2 / totalDocs) * 100 : 0;
  const l3Percentage = totalDocs > 0 ? (analytics.levelDistribution.l3 / totalDocs) * 100 : 0;

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
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>סה״כ מסמכים</span>
                <Badge variant="outline">{analytics.totalDocuments.toLocaleString()}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>ממתינים לאישור</span>
                <Badge variant="secondary">{analytics.pendingApprovals}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>עודכן</span>
                <span className="text-muted-foreground">{analytics.lastUpdate}</span>
              </div>
              
              {/* Level Distribution */}
              <div className="pt-2 space-y-2">
                <div className="text-xs font-medium">התפלגות רמות</div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12">Core</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${analytics.levelDistribution.core > 0 ? 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{analytics.levelDistribution.core}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12">L1</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${l1Percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{analytics.levelDistribution.l1}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12">L2</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${l2Percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{analytics.levelDistribution.l2}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs w-12">L3</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full transition-all"
                        style={{ width: `${l3Percentage}%` }}
                      />
                    </div>
                    <span className="text-xs w-8 text-right">{analytics.levelDistribution.l3}</span>
                  </div>
                </div>
              </div>
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