import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  Shield, 
  BookOpen, 
  TrendingUp,
  ArrowLeft,
  Users,
  FileCheck,
  Brain
} from "lucide-react";

export const HeroSection = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-subtle" dir="rtl">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(45deg,theme(colors.border)_1px,transparent_1px)] bg-[size:20px_20px] opacity-30"></div>
      
      <div className="relative container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Hero Content */}
          <div className="space-y-8 text-right">
            <div className="space-y-4">
              <Badge variant="outline" className="text-primary border-primary/30 bg-primary/5">
                <Shield className="h-3 w-3 ml-1" />
                מערכת ידע מתקדמת
              </Badge>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight text-right">
                המוח הדיגיטלי של
                <span className="text-primary"> פק״ל במילואים</span>
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg text-right">
                מערכת חכמה לניהול ידע, תוכן ותובנות שמחברת בין ערכי פק״ל לבין יחידות המילואים
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              <Button variant="command" size="lg" className="gap-2" dir="ltr" asChild>
                <Link to="/chat">
                  <MessageSquare className="h-5 w-5" />
                  התחל שיחה עם המוח
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" size="lg" className="gap-2" dir="ltr" asChild>
                <Link to="/knowledge">
                  <BookOpen className="h-5 w-5" />
                  עיין במסמכי הליבה
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-6 pt-4 justify-start">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">156</div>
                <div className="text-sm text-muted-foreground">מסמכים פעילים</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">23</div>
                <div className="text-sm text-muted-foreground">יחידות מחוברות</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">2.8K</div>
                <div className="text-sm text-muted-foreground">שיחות השבוע</div>
              </div>
            </div>
          </div>

          {/* Feature Cards */}
          <div className="space-y-4">
            <Card className="bg-card shadow-card border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6" dir="rtl">
                <div className="flex items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-card-foreground text-right">צ'אט חכם מבוסס RAG</h3>
                    <p className="text-sm text-muted-foreground text-right">
                      קבל תשובות מדויקות עם ציטוטים ממקורות מאושרים, מבוסס על מסמכי הליבה הארגוניים והיחידתיים
                    </p>
                    <Badge variant="secondary" className="text-xs">זמין כעת</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-primary/10">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-card border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6" dir="rtl">
                <div className="flex items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-card-foreground text-right">ניהול מסמכים מרובה רמות</h3>
                    <p className="text-sm text-muted-foreground text-right">
                      מסמכי ליבה ארגוניים, יחידתיים וחומרי הדרכה בשלוש רמות עם תהליך אישור מובנה
                    </p>
                    <Badge variant="secondary" className="text-xs">L1-L3</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-success/10">
                    <FileCheck className="h-6 w-6 text-success" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card shadow-card border-border/50 hover:shadow-lg transition-shadow">
              <CardContent className="p-6" dir="rtl">
                <div className="flex items-start gap-4">
                  <div className="space-y-2 flex-1">
                    <h3 className="font-semibold text-card-foreground text-right">תובנות מהשטח</h3>
                    <p className="text-sm text-muted-foreground text-right">
                      ניתוח שיחות וזיהוי דפוסים למיטוב התוכן והשפה הפק״לית
                    </p>
                    <Badge variant="secondary" className="text-xs">אנליטיקה</Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/10">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};