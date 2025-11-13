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

const mockChatInsights: ChatInsight[] = [
  {
    id: '1',
    question: 'איך מחזקים לכידות פלוגתית?',
    frequency: 47,
    avgRating: 4.2,
    lastAsked: new Date('2024-01-30'),
    category: 'לכידות',
    trend: 'up'
  },
  {
    id: '2',
    question: 'מה הם עקרונות המנהיגות בפק״ל?',
    frequency: 38,
    avgRating: 4.5,
    lastAsked: new Date('2024-01-29'),
    category: 'מנהיגות',
    trend: 'stable'
  },
  {
    id: '3',
    question: 'איך מתמודדים עם קונפליקטים בצוות?',
    frequency: 29,
    avgRating: 3.8,
    lastAsked: new Date('2024-01-28'),
    category: 'ניהול',
    trend: 'down'
  }
];

const mockUsageStats: UsageStats = {
  totalChats: 2145,
  totalUsers: 234,
  avgSessionLength: 8.5,
  satisfactionRate: 87,
  topUnits: ['פלוגה א׳', 'פלוגה ב׳', 'פלוגה ג׳'],
  weeklyGrowth: 12.5
};

const mockUsageTrends: UsageTrend[] = [
  { day: 'א׳', chats: 45, users: 18 },
  { day: 'ב׳', chats: 62, users: 24 },
  { day: 'ג׳', chats: 58, users: 22 },
  { day: 'ד׳', chats: 73, users: 28 },
  { day: 'ה׳', chats: 68, users: 26 },
  { day: 'ו׳', chats: 52, users: 20 },
  { day: 'ש׳', chats: 38, users: 15 }
];

const mockTopicDistribution: TopicDistribution[] = [
  { topic: 'מנהיגות', count: 156, percentage: 35, color: 'hsl(var(--primary))' },
  { topic: 'לכידות', count: 134, percentage: 30, color: 'hsl(var(--accent))' },
  { topic: 'ניהול', count: 89, percentage: 20, color: 'hsl(var(--success))' },
  { topic: 'הדרכה', count: 67, percentage: 15, color: 'hsl(var(--warning))' }
];

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
                  <p className="text-2xl font-bold">{mockUsageStats.totalChats.toLocaleString()}</p>
                </div>
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-4 w-4 text-success" />
                <span className="text-sm text-success">+{mockUsageStats.weeklyGrowth}%</span>
                <span className="text-sm text-muted-foreground">השבוע</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">משתמשים פעילים</p>
                  <p className="text-2xl font-bold">{mockUsageStats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-accent" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-muted-foreground">בממוצע {mockUsageStats.avgSessionLength} דק׳ לשיחה</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">שביעות רצון</p>
                  <p className="text-2xl font-bold">{mockUsageStats.satisfactionRate}%</p>
                </div>
                <ThumbsUp className="h-8 w-8 text-success" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <span className="text-sm text-success">מעולה</span>
                <span className="text-sm text-muted-foreground">מעל היעד</span>
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
                {/* Satisfaction Calculation Explainer */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-semibold mb-2">איך מחושבת שביעות הרצון?</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• <strong>דירוג תשובות:</strong> כל תשובה מקבלת דירוג 1-5 כוכבים מהמשתמש</li>
                    <li>• <strong>זמן תגובה:</strong> תשובות מהירות (מתחת ל-3 שניות) מקבלות ניקוד נוסף</li>
                    <li>• <strong>רלוונטיות מקור:</strong> מקורות L1 מקבלים משקל גבוה יותר</li>
                    <li>• <strong>שביעות רצון כללית:</strong> ממוצע משוקלל של כל הפרמטרים</li>
                  </ul>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-success">4.2</div>
                    <div className="text-sm text-muted-foreground">ממוצע דירוגים</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">2.3s</div>
                    <div className="text-sm text-muted-foreground">זמן תגובה ממוצע</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-accent">78%</div>
                    <div className="text-sm text-muted-foreground">תשובות עם מקור L1</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-warning">92%</div>
                    <div className="text-sm text-muted-foreground">שיחות שהסתיימו בהצלחה</div>
                  </div>
                </div>

                {/* Satisfaction Distribution */}
                <div className="space-y-3">
                  <h4 className="font-semibold">התפלגות דירוגים</h4>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const percentage = rating === 5 ? 45 : rating === 4 ? 32 : rating === 3 ? 15 : rating === 2 ? 6 : 2;
                    return (
                      <div key={rating} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-8">{rating}⭐</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="h-2 bg-success rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-12">{percentage}%</span>
                      </div>
                    );
                  })}
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
                {mockChatInsights.map((insight, index) => (
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
                ))}
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
              <div className="space-y-4">
                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg">
                  <h4 className="font-semibold text-destructive mb-2">פערים דחופים (חסרי מקורות L1)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">איך מחזקים לכידות פלוגתית?</span>
                      <Badge variant="destructive" className="text-xs">47 פניות</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">טיפול בקונפליקטים בצוות</span>
                      <Badge variant="destructive" className="text-xs">29 פניות</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ליווי משפחות בזמן שירות</span>
                      <Badge variant="destructive" className="text-xs">23 פניות</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 border border-warning/20 bg-warning/5 rounded-lg">
                  <h4 className="font-semibold text-warning mb-2">פערים בינוניים (זקוקים לשיפור L2)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">הכשרת מדריכים חדשים</span>
                      <Badge variant="secondary" className="text-xs">14 פניות</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">ניהול קונפליקטים בין-דוריים</span>
                      <Badge variant="secondary" className="text-xs">11 פניות</Badge>
                    </div>
                  </div>
                </div>
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
              <div className="space-y-4">
                <div className="p-4 border border-success/20 bg-success/5 rounded-lg">
                  <h4 className="font-semibold text-success mb-2">פעולות מיידיות</h4>
                  <ul className="text-sm space-y-1">
                    <li>• יצירת מדריך L1 לחיזוק לכידות פלוגתית</li>
                    <li>• פיתוח כרטיסיות פעילות לטיפול בקונפליקטים</li>
                    <li>• הכנת חומר הדרכה לליווי משפחות</li>
                  </ul>
                </div>

                <div className="p-4 border border-primary/20 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">שיפורים ארוכי טווח</h4>
                  <ul className="text-sm space-y-1">
                    <li>• פיתוח מערכת משוב אוטומטית</li>
                    <li>• יצירת בסיס נתונים של מקרי בוחן</li>
                    <li>• הקמת צוות מומחים לתחומים חסרים</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-success">3</div>
                    <div className="text-sm text-muted-foreground">מדריכי L1 נדרשים</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-warning">2</div>
                    <div className="text-sm text-muted-foreground">שיפורי L2 מומלצים</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-primary">60h</div>
                    <div className="text-sm text-muted-foreground">זמן פיתוח משוער</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Insights;