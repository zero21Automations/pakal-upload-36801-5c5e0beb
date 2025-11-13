import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  MessageSquare, 
  Users, 
  FileText,
  Clock,
  ThumbsUp,
  ThumbsDown,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Calendar,
  LayoutDashboard,
  Search,
  AlertTriangle
} from "lucide-react";

interface ChatInsight {
  id: string;
  question: string;
  frequency: number;
  avgRating: number;
  lastAsked: Date;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

interface UsageStats {
  totalChats: number;
  totalUsers: number;
  avgSessionLength: number;
  satisfactionRate: number;
  topUnits: string[];
  weeklyGrowth: number;
}

interface UsageTrend {
  day: string;
  chats: number;
  users: number;
}

interface TopicDistribution {
  topic: string;
  count: number;
  percentage: number;
  color: string;
}

const chatInsights: ChatInsight[] = [];

const usageStats: UsageStats = {
  totalChats: 0,
  totalUsers: 0,
  avgSessionLength: 0,
  satisfactionRate: 0,
  topUnits: [],
  weeklyGrowth: 0
};

const usageTrends: UsageTrend[] = [];

const topicDistribution: TopicDistribution[] = [];

const Insights = () => {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedUnit, setSelectedUnit] = useState('all');

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
            
             <Button variant="outline" className="gap-2" dir="rtl">
               <Download className="h-4 w-4" />
               ייצא דוח
             </Button>
          </div>
          </div>

          {/* Statistics Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">סה״כ שיחות</p>
                  <p className="text-2xl font-bold">{usageStats.totalChats.toLocaleString()}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {usageStats.weeklyGrowth > 0 && (
                  <>
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-sm text-success">+{usageStats.weeklyGrowth}%</span>
                    <span className="text-sm text-muted-foreground">השבוע</span>
                  </>
                )}
                {usageStats.weeklyGrowth === 0 && (
                  <span className="text-sm text-muted-foreground">אין נתונים</span>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">משתמשים פעילים</p>
                  <p className="text-2xl font-bold">{usageStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {usageStats.avgSessionLength > 0 ? (
                  <span className="text-sm text-muted-foreground">בממוצע {usageStats.avgSessionLength} דק׳ לשיחה</span>
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
                  <p className="text-2xl font-bold">{usageStats.satisfactionRate}%</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-success" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                {usageStats.satisfactionRate > 0 ? (
                  <>
                    <span className="text-sm text-success">מעולה</span>
                    <span className="text-sm text-muted-foreground">מעל היעד</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">אין נתונים</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 1. Satisfaction Rubric */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                שביעות רצון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-muted-foreground">אין נתוני שביעות רצון זמינים</p>
                  <p className="text-sm text-muted-foreground mt-2">נתונים יופיעו כאשר משתמשים יתחילו להשתמש במערכת</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 2. Popular Questions Rubric */}
        <div className="space-y-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                שאלות פופולריות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {chatInsights.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>אין שאלות פופולריות זמינות</p>
                    <p className="text-sm mt-2">נתונים יופיעו כאשר משתמשים יתחילו לשאול שאלות</p>
                  </div>
                ) : (
                  chatInsights.map((insight, index) => (
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
                            <span>דירוג: {insight.avgRating}/5</span>
                            <span>לאחרונה: {insight.lastAsked.toLocaleDateString("he-IL")}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getTrendIcon(insight.trend)}
                        <span className="text-sm">{getTrendText(insight.trend)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Knowledge Gaps and Improvement Recommendations Rubric */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                פערי ידע והמלצות לשיפור
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>אין פערי ידע מזוהים</p>
                <p className="text-sm mt-2">הניתוח יתבצע אוטומטית כאשר יהיו מספיק נתוני שימוש</p>
              </div>
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
              <div className="p-8 text-center text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>אין המלצות לשיפור כרגע</p>
                <p className="text-sm mt-2">המלצות יוצגו לאחר ניתוח הנתונים</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insights;