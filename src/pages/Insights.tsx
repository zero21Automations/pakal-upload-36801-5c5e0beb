import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useInsightsData } from "@/hooks/useInsightsData";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  MessageSquare, 
  Users, 
  ThumbsUp,
  Activity,
  Download,
  Calendar,
  LayoutDashboard,
  Search,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

const Insights = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedUnit, setSelectedUnit] = useState('all');
  
  const { 
    loading, 
    error, 
    usageStats, 
    chatInsights, 
    knowledgeGaps,
    usageTrends,
    refetch 
  } = useInsightsData(selectedPeriod, selectedUnit);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-success" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-destructive rotate-180" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'up': return 'עולה';
      case 'down': return 'יורד';
      default: return 'יציב';
    }
  };

  const handleExport = () => {
    toast({
      title: "ייצוא דוח",
      description: "הדוח מיוצא...",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6" dir="rtl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">דשבורד תובנות</h1>
            </div>
            <p className="text-muted-foreground">נתוני שימוש, מגמות ותובנות מהשטח</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetch()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32" dir="rtl">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">יום</SelectItem>
                <SelectItem value="week">שבוע</SelectItem>
                <SelectItem value="month">חודש</SelectItem>
                <SelectItem value="quarter">רבעון</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={selectedUnit} onValueChange={setSelectedUnit}>
              <SelectTrigger className="w-32" dir="rtl">
                <Users className="h-4 w-4 ml-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל היחידות</SelectItem>
                <SelectItem value="unit-a">פלוגה א׳</SelectItem>
                <SelectItem value="unit-b">פלוגה ב׳</SelectItem>
                <SelectItem value="unit-c">פלוגה ג׳</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="gap-2" dir="rtl" onClick={handleExport}>
              <Download className="h-4 w-4" />
              ייצא דוח
            </Button>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <span>שגיאה בטעינת נתונים: {error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">סה״כ שיחות</p>
                  {loading ? (
                    <Skeleton className="h-8 w-20 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{usageStats.totalChats.toLocaleString()}</p>
                  )}
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {loading ? (
                  <Skeleton className="h-4 w-24" />
                ) : usageStats.weeklyGrowth !== 0 ? (
                  <>
                    <TrendingUp className={`h-4 w-4 ${usageStats.weeklyGrowth > 0 ? 'text-success' : 'text-destructive rotate-180'}`} />
                    <span className={`text-sm ${usageStats.weeklyGrowth > 0 ? 'text-success' : 'text-destructive'}`}>
                      {usageStats.weeklyGrowth > 0 ? '+' : ''}{usageStats.weeklyGrowth}%
                    </span>
                    <span className="text-sm text-muted-foreground">השבוע</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">אין שינוי מהשבוע הקודם</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">משתמשים פעילים</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">{usageStats.totalUsers}</p>
                  )}
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : usageStats.avgSessionLength > 0 ? (
                  <span className="text-sm text-muted-foreground">
                    בממוצע {usageStats.avgSessionLength} הודעות לשיחה
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">אין נתונים</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">שביעות רצון</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold">
                      {usageStats.satisfactionRate > 0 ? `${usageStats.satisfactionRate}%` : 'N/A'}
                    </p>
                  )}
                </div>
                <ThumbsUp className="h-8 w-8 text-success" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-muted-foreground">
                  {usageStats.satisfactionRate > 0 ? 'מעל היעד' : 'נדרשת מערכת דירוג'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Popular Questions */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                שאלות פופולריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : chatInsights.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין שאלות פופולריות זמינות</p>
                  <p className="text-sm mt-2">נתונים יופיעו כאשר משתמשים יתחילו לשאול שאלות</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatInsights.map((insight, index) => (
                    <div key={insight.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold">{index + 1}</span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{insight.question}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{insight.frequency} פעמים</span>
                            <Badge variant="outline">{insight.category}</Badge>
                            <span>לאחרונה: {insight.lastAsked.toLocaleDateString("he-IL")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTrendIcon(insight.trend)}
                        <span className="text-sm">{getTrendText(insight.trend)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Knowledge Gaps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                פערי ידע מזוהים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : knowledgeGaps.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין פערי ידע מזוהים</p>
                  <p className="text-sm mt-2">הניתוח יתבצע אוטומטית כאשר יהיו מספיק נתוני שימוש</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeGaps.map((gap, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={gap.hasL1 ? "secondary" : "destructive"} className="text-xs">
                          {gap.hasL1 ? 'יש L1' : 'חסר L1'}
                        </Badge>
                        <span className="text-sm">{gap.topic}</span>
                      </div>
                      <Badge variant="outline">{gap.count} פניות</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                המלצות לשיפור
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : knowledgeGaps.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>אין המלצות לשיפור כרגע</p>
                  <p className="text-sm mt-2">המלצות יוצגו לאחר ניתוח הנתונים</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {knowledgeGaps.filter(g => !g.hasL1).slice(0, 3).map((gap, index) => (
                    <div key={index} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">עדיפות {index + 1}</Badge>
                      </div>
                      <p className="text-sm">
                        יצירת מדריך L1 עבור: <strong>{gap.topic}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {gap.count} פניות ללא מקור L1
                      </p>
                    </div>
                  ))}
                  {knowledgeGaps.filter(g => !g.hasL1).length === 0 && (
                    <div className="p-4 bg-success/10 rounded-lg text-center">
                      <p className="text-sm text-success">כל השאלות מקבלות מענה מתוכן L1! 🎉</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insights;
