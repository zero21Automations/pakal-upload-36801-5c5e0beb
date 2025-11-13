import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            מי אנחנו
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            פק"ל — פלוגה, קהילה, לכידות
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-8">
          {/* Introduction Card */}
          <Card className="border-r-4 border-r-primary">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">אודותינו</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg leading-relaxed">
              <p>
                פק"ל — פלוגה, קהילה, לכידות היא יוזמה בעלת משמעות עמוקה, שפועלת במערך המילואים כבר למעלה מ-7 שנים בשיתוף עם אכ"א, קצין מילואים ראשי, בית הספר לפיתוח מנהיגות וקרן מיראז' ישראל.
              </p>
              <p>
                הפרויקט החל בשנת 2018 כתגובה לצמצום ימי השירות, והפך לאחר שנים ספורות לחלק בלתי נפרד ממערך המילואים.
              </p>
              <p>
                כיום פק"ל פועלת כיחידה צבאית במסגרת עתכ"א, בשיתוף פעולה הדוק עם קמל"ר וביסל"מ, ומתמקדת בפיתוח מנהיגות, חיזוק לכידות ביחידות והעצמת העורף המשפחתי.
              </p>
            </CardContent>
          </Card>

          {/* Our Story Card */}
          <Card className="border-r-4 border-r-secondary">
            <CardHeader>
              <CardTitle className="text-2xl text-secondary">הסיפור שלנו</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg leading-relaxed">
              <p>
                פק"ל מפתחת ומטמיעה כלים קהילתיים ומנהיגותיים לשיפור הלכידות והמורל ביחידות מילואים, במטרה להעלות את המוטיבציה, לצמצם שחיקה ולהגדיל את אחוזי ההתייצבות.
              </p>
              <p>
                התהליך מתבצע בדרך של ליווי יחידתי כולל: אפיון הצרכים, הכשרת בעלי תפקידים, ייעוץ והטמעה בפועל של שגרות לאורך כשנה.
              </p>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-foreground">הערכים המרכזיים שמנחים אותנו:</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">קשרים</Badge>
                  <Badge variant="secondary">זהות</Badge>
                  <Badge variant="secondary">משמעות</Badge>
                  <Badge variant="secondary">ערך</Badge>
                </div>
                <p className="mt-3 text-muted-foreground">
                  מתוך הבנה שמילואי יחידת המילואים – לא רק חובה, אלא הזדמנות לבנות תרבות ארגונית חזקה שמאפשרת עמידות ושיתוף פעולה בשגרה ובשעת חירום.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Channels */}
          <Card className="border-r-4 border-r-accent">
            <CardHeader>
              <CardTitle className="text-2xl text-accent">שלושת ערוצי הפעולה שלנו</CardTitle>
              <CardDescription>תכנית העבודה</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg">
                  <h4 className="font-bold text-lg text-primary mb-3">לכידות יחידתית</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• הכשרות למפקדים ולמובילי לכידות בפלוגה ובגדוד</li>
                    <li>• גיבוש תכניות לכידות מותאמות לצרכי היחידה</li>
                    <li>• הטמעת שגרות וכלים לקידום קשרים אמינים בתוך המסגרת</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 p-6 rounded-lg">
                  <h4 className="font-bold text-lg text-secondary mb-3">מנהיגות מפקדים</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• ליווי אישי והדרכה מקצועית לאורך כל התהליך</li>
                    <li>• סדנאות ופעילויות בצוותים לפיתוח יכולות פיקוד</li>
                    <li>• מותאמות לאתגרים בשטח</li>
                  </ul>
                </div>

                <div className="bg-gradient-to-br from-accent/10 to-accent/5 p-6 rounded-lg">
                  <h4 className="font-bold text-lg text-accent mb-3">קהילת עורף חזק</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• הקמה והנחייה של קהילות עבור משפחות המשרתים</li>
                    <li>• מפגשים, תמיכה רגשית, תיעודי חוויות</li>
                    <li>• אירועים חווייתיים ופעילויות לזוגות</li>
                    <li>• תמיכה דרך קבוצות בזום ועוד</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Why it matters */}
          <Card className="border-r-4 border-r-success">
            <CardHeader>
              <CardTitle className="text-2xl text-success">מדוע זה חשוב</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg leading-relaxed">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-success/5 rounded-lg">
                  <h4 className="font-semibold text-success mb-2">לכידות</h4>
                  <p className="text-sm">יוצרת אמון ותקשורת חזקה בין חברי היחידה, מה שממריץ תחושת מחויבות ושייכות</p>
                </div>
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <h4 className="font-semibold text-primary mb-2">זהות</h4>
                  <p className="text-sm">מחברת בין עבר, הווה ועתיד, ויוצרת תחושת משמעות עמוקה בפעולה הצבאית</p>
                </div>
                <div className="text-center p-4 bg-secondary/5 rounded-lg">
                  <h4 className="font-semibold text-secondary mb-2">עורף משפחתי</h4>
                  <p className="text-sm">כשהמשפחות מרגישות שייכות ותמיכה, ההשפעה החיובית במילואים רק מתעצמת</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Personal Appeal */}
          <Card className="bg-gradient-to-l from-primary/10 via-background to-secondary/10 border-primary">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">פנייה אישית למפקדים</CardTitle>
            </CardHeader>
            <CardContent className="text-lg leading-relaxed">
              <p className="mb-4">
                אלו מפקדים בשר ושיער — זוהי הזדמנות לעבוד עם מציאות אתגרית ולאתגר אותה.
              </p>
              <p>
                תכנית פק"ל מציעה מסע מובנה, מלא תמיכה ומשאבים, שמתחיל בלמידת ניהול, כוללת עבודה שוטפת עם צוות מוביל בשטח, ומסתיים ביצירת תרבות של לכידות ומנהיגות חיה ובועטת.
              </p>
            </CardContent>
          </Card>

          {/* Summary Table */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-2xl">סיכום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-right p-3 font-semibold bg-muted/30">תקציר</th>
                      <th className="text-right p-3 font-semibold bg-muted/30">תיאור</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    <tr className="border-b border-border/50">
                      <td className="p-3 font-medium">מיזוג של חזון ותכלית</td>
                      <td className="p-3">פק"ל מחברת בין כלים קהילתיים, מנהיגותיים ותומכים לבניית יחידות מחוברות וחזקות</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-3 font-medium">ערכים מרכזיים</td>
                      <td className="p-3">קשרים, זהות, משמעות, ערך</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-3 font-medium">מי אנחנו</td>
                      <td className="p-3">יוזמה צבאית-חברתית עם ניסיון ומומחיות, בשיתוף גופי צבא והחברה</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-3 font-medium">תכנית פעולה</td>
                      <td className="p-3">ליווי, הכשרות, קהילת עורף, תמיכה רציפה</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">למה זה עובד</td>
                      <td className="p-3">אמון, שייכות, חוסן משפחתי — קודם לפעולה מבצעית</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;