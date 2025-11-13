import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  ArrowLeft, 
  FileText, 
  Shield,
  Clock,
  CheckCircle
} from "lucide-react";

export const ChatPreview = () => {
  return (
    <div className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">המוח הדיגיטלי בפעולה</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            צפה איך המערכת מספקת תשובות מדויקות מבוססות מקורות מאושרים
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-card shadow-lg border-border/50">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  צ'אט עם המוח הפק״לי
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  מאובטח
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Chat Messages */}
              <div className="space-y-4 p-6">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="max-w-md bg-primary text-primary-foreground rounded-lg p-4">
                    <p className="text-sm">איך אני יכול לחזק את הלכידות בפלוגה שלי במהלך תרגיל מילואים?</p>
                    <div className="flex items-center gap-1 mt-2 text-xs opacity-80">
                      <Clock className="h-3 w-3" />
                      10:42
                    </div>
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start">
                  <div className="max-w-2xl">
                    <div className="bg-secondary rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="h-6 w-6 rounded bg-gradient-primary flex items-center justify-center">
                          <Shield className="h-4 w-4 text-primary-foreground" />
                        </div>
                        <span className="font-medium text-sm">המוח הפק״לי</span>
                        <Badge variant="outline" className="text-xs">מבוסס RAG</Badge>
                      </div>
                      
                      <div className="space-y-3 text-sm text-foreground">
                        <p>
                          על פי מסמך הליבה הארגוני ומסמכי ההדרכה המאושרים, ישנן מספר דרכים מוכחות לחיזוק הלכידות:
                        </p>
                        
                        <div className="space-y-2">
                          <p><strong>1. פעילויות בניית צוות משותפות:</strong></p>
                          <p className="mr-4">יצירת אתגרים קבוצתיים שדורשים שיתוף פעולה והישענות הדדית בין החיילים.</p>
                          
                          <p><strong>2. תרגילי סימולציה מציאותיים:</strong></p>
                          <p className="mr-4">חשיפה לתרחישים המדמים מצבי לחץ אמיתיים כדי לבנות אמון הדדי.</p>
                          
                          <p><strong>3. מנהיגות אישית של המפקד:</strong></p>
                          <p className="mr-4">הובלה בדוגמה אישית והדגמה של ערכי הגבורה והאחריות.</p>
                        </div>
                      </div>

                      {/* Citations */}
                      <div className="mt-4 pt-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground mb-2">מקורות:</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">L1</Badge>
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">אוגדן ערכי פק״ל 2024 - עמ׳ 23-25</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">L2</Badge>
                            <FileText className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">כרטיסיה הדרכת מפקדים - פלוגה ב׳</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-success" />
                        נוצר מ-3 מקורות מאושרים
                        <span className="mx-1">•</span>
                        <Clock className="h-3 w-3" />
                        10:43
                      </div>
                    </div>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex justify-center">
                  <Button variant="command" size="lg" className="gap-2">
                    <MessageSquare className="h-5 w-5" />
                    התחל שיחה חדשה
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};