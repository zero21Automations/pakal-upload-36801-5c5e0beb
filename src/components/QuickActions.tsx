import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { 
  MessageSquare, 
  Upload, 
  Users, 
  FileText,
  Plus,
  Search,
  BookOpen,
  Settings
} from "lucide-react";

export const QuickActions = () => {
  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground mb-4">פעולות מהירות</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          גישה מהירה לכלים המרכזיים של המערכת
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Smart Chat */}
        <Card className="bg-card shadow-card hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-4 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-lg">צ'אט חכם</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              שאל שאלות וקבל תשובות מבוססות מקורות
            </p>
            <Button variant="default" className="w-full gap-2" asChild dir="ltr">
              <Link to="/chat">
                <MessageSquare className="h-4 w-4" />
                התחל שיחה
              </Link>
            </Button>
            <Badge variant="secondary" className="text-xs">2.1K שיחות השבוע</Badge>
          </CardContent>
        </Card>

        {/* Upload Document */}
        <Card className="bg-card shadow-card hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-4 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
              <Upload className="h-8 w-8 text-success" />
            </div>
            <CardTitle className="text-lg">העלה מסמך</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              הוסף חומרי הדרכה ומסמכים חדשים
            </p>
            <Button variant="success" className="w-full gap-2" asChild dir="ltr">
              <Link to="/knowledge">
                <Plus className="h-4 w-4" />
                בחר קובץ
              </Link>
            </Button>
            <Badge variant="outline" className="text-xs">PDF, DOC, MP4</Badge>
          </CardContent>
        </Card>

        {/* Manage Units */}
        <Card className="bg-card shadow-card hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-4 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
              <Users className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-lg">ניהול יחידות</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              נהל הרשאות ומסמכי ליבה יחידתיים
            </p>
            <Button variant="accent" className="w-full gap-2" asChild dir="ltr">
              <Link to="/units">
                <Settings className="h-4 w-4" />
                עבר לניהול
              </Link>
            </Button>
            <Badge variant="secondary" className="text-xs">23 יחידות פעילות</Badge>
          </CardContent>
        </Card>

        {/* Browse Knowledge */}
        <Card className="bg-card shadow-card hover:shadow-lg transition-all duration-300 group cursor-pointer">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto p-4 rounded-full bg-warning/10 group-hover:bg-warning/20 transition-colors">
              <BookOpen className="h-8 w-8 text-warning" />
            </div>
            <CardTitle className="text-lg">עיון בידע</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              חפש במסמכים ובמילון המונחים
            </p>
            <Button variant="warning" className="w-full gap-2" asChild dir="ltr">
              <Link to="/knowledge">
                <Search className="h-4 w-4" />
                חיפוש מתקדם
              </Link>
            </Button>
            <Badge variant="secondary" className="text-xs">156 מסמכים זמינים</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="mt-12">
        <h3 className="text-xl font-semibold text-foreground mb-6">פעילות אחרונה</h3>
        <div className="space-y-3">
          {[
            { action: "מסמך חדש אושר", item: "כרטיסיה הדרכת מפקדים - פלוגה ב'", time: "לפני 2 שעות", status: "approved" },
            { action: "שיחת צ'אט", item: "איך לחזק לכידות פלוגתית?", time: "לפני 4 שעות", status: "chat" },
            { action: "מסמך הועלה", item: "אוגדן ערכי פק״ל 2024", time: "לפני יום", status: "pending" },
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <div>
                  <p className="font-medium text-sm text-foreground text-right">{activity.action}</p>
                  <p className="text-sm text-muted-foreground text-right">{activity.item}</p>
                </div>
                <div className={`h-2 w-2 rounded-full ${
                  activity.status === 'approved' ? 'bg-success' :
                  activity.status === 'chat' ? 'bg-primary' : 'bg-warning'
                }`} />
              </div>
              <p className="text-xs text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};