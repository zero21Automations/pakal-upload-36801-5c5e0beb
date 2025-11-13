import { useState, useEffect } from "react";
import { SystemInsightsWindow } from "@/components/SystemInsightsWindow";
import { Navigation } from "@/components/Navigation";
import { ProcessingStatusCard } from "@/components/ProcessingStatusCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Settings, 
  Layers, 
  Target, 
  BookOpenCheck, 
  ScrollText, 
  MessageCircle, 
  Video, 
  Image,
  Building2,
  User,
  History,
  BarChart3,
  Star,
  BookOpen
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { UploadModal } from "@/components/UploadModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SystemDocument {
  id: string;
  title: string;
  type: 'organizational' | 'unit';
  version: number;
  status: 'active' | 'pending' | 'draft';
  unitName?: string;
  lastUpdated: Date;
  updatedBy: string;
  size: string;
  content?: string;
}

interface Document {
  id: string;
  title: string;
  type: 'pdf' | 'video' | 'image' | 'doc';
  level: 1 | 2 | 3;
  status: 'טיוטה' | 'ממתין לאישור' | 'מאושר' | 'נדחה';
  unit: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: string;
  tags?: string[];
  confidence?: number;
  reasons?: string;
  notes?: string;
}

interface Term {
  id: string;
  term: string;
  definition: string;
  example?: string;
  category: string;
  sources: string[];
  lastUpdated: Date;
  updatedBy: string;
}

interface Knowledge {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  level: number;
  lastUpdated: Date;
  views: number;
}

// Mock Data - Core Documents
const mockSystemDocs: SystemDocument[] = [
  {
    id: 'CORE_ORG_2024',
    title: '📘 מסמך ליבה – פק״ל במילואים 2025',
    type: 'organizational',
    version: 12,
    status: 'active',
    lastUpdated: new Date('2024-01-25'),
    updatedBy: 'צוות פק״ל מטה',
    size: '4.2 MB',
    content: `פרק 1 – עקרונות ותהליכי עבודה של הארגון
מטרת פק״ל

פק״ל – פלוגה, קהילה, לכידות – היא תוכנית לאומית לפיתוח יחידות מילואים כקהילות מלוכדות.
הארגון פועל מתוך תפיסה הרואה את יחידת המילואים כקהילה.
המטרה: חיזוק הזהות, המשמעות, הקשרים והערך של השירות המילואימניקי, בצבא ובחברה האזרחית.

שותפים וייחודיות

פועל בשיתוף אכ״א, קמל״ר, בה״ד לפיתוח מנהיגות, וקרן מיראז׳ ישראל.

צוות המנחים כולם משרתי מילואים פעילים בעלי ניסיון כפול – גם כמפקדים/חיילים, וגם כאנשי מקצוע מעולמות בניית קהילה, הנחיית קבוצות ופיתוח מנהיגות.

ייחודיות: חיבור עמוק לשטח, לתרבות היחידה ולשפת המילואים. מחויבות ארוכת טווח לשינוי עומק.

שלושת מישורי הפעולה המרכזיים

לכידות יחידתית – הכשרת "ציר לכידות" בכל יחידה, סיוע בתכנון ויישום תוכניות חיזוק לכידות.

עורף משפחתי – ליווי והקמת קהילות עורף (בני/בנות זוג ומשפחות). מתן מענה מקצועי לאתגרים בבית בזמן השירות.

מנהיגות מילואימניקית – מתן כלים פיקודיים ומנהיגותיים מותאמים לאתגרים הייחודיים של מפקדי המילואים.

תהליכי עבודה מרכזיים

ליווי שנתי ליחידות: סדנאות, הכשרות, ימי עיון, ופעילויות ODT.

שימור קשר שוטף: מפגשים, זום, קבוצות תקשורת פלוגתיות.

קליטה מובנית: קליטת חיילים ומפקדים חדשים עם ליווי אישי.

פיתוח מנהיגות: העצמת מפקדים וחיזוק כישורי תקשורת.

תמיכה בתקופות שקטות: פעילות למניעת נתק בין שירותים.

פרק 2 – תפקידי המנחים והמלוים
מנחי פק״ל

מובילים את תהליכי הליווי ביחידות.

שומרים על עקרונות הליבה (זהות, קשרים, משמעות, ערך).

מתאימים את הפעילות לצורכי היחידה.

משמשים גשר בין הפיקוד לחיילים, מייצרים מרחב בטוח לשיח.

מלווי פק״ל

מסייעים למנחים בהפקה ותיאום.

עוקבים אחרי מדדי לכידות.

שומרים על קשר רציף עם היחידות.

תומכים בקליטה של חיילים ומפקדים חדשים.

פרק 3 – תפקיד הצ'אט בארגון
מה הצ'אט עושה

משמש כערוץ תמיכה, הדרכה וייעוץ למנחי ומלווי פק״ל.

עונה לשאלות לפי היררכיית הידע (רמה 1 → רמה 2 → רמה 3).

מציע רעיונות לסדנאות ופעילויות.

מספק נימוקים וציטוטים ישירים מהמקורות.

באיזו "שפה" הצ'אט מדבר

ערכית-מקצועית – מכבדת, תומכת, מבוססת לכידות וערבות הדדית.

מנחיתית – שאלות פתוחות, דוגמאות מהשטח, המלצות מותאמות.

מינוח פק״לי – זהות, קשרים, משמעות, ערך.

מה הצ'אט לא עושה

לא ממציא מידע שלא מבוסס מקור.

לא מחליף שיקול דעת מקצועי.

לא מתקשר ישירות עם חיילים בשטח.

פרק 4 – היררכיית הידע
רמה 1 – תוכן ייחודי לפק״ל

אוגדנים, חזון, מדריכים מקוריים.

כתובים ע״י צוות פק״ל.

עדיפות מוחלטת בתשובות הצ'אט.

רמה 2 – כלים והדרכות

כרטיסיות פעילות, מדריכי הכשרה, נהלים.

נכתבים ומעודכנים ע״פ ניסיון שטח.

רמה 3 – העמקה ומחקר

מקורות חיצוניים (מחקרים, דוחות, מאמרים).

להרחבת ההקשר בלבד.

עקרון נימוקים
כל תשובה בצ'אט כוללת סימון מקור והרמה. רצוי לשלב כמה רמות להעמקה.

פרק 5 – קהלי יעד וסיפורי משתמש
קהלי יעד

מנחי ומלווי פק״ל.

מפקדי יחידות מילואים (חטיבות, גדודים, פלוגות).

אנשי מקצוע בתחומי לכידות ומנהיגות.

סיפורי משתמש

מנחה פלוגתי – צריך פעילות חיזוק לכידות. פונה לצ'אט ומקבל רעיון מבוסס רמות 1+2.

מלווה חטיבתי – מציג למפקדים את חשיבות הלכידות. נעזר בציטוטי אוגדנים (רמה 1) ובמחקר עדכני (רמה 3).

מפקד גדוד – קולט מפקדים חדשים. מקבל מהצ'אט תהליך קליטה מכרטיסיות (רמה 2) עם ערך מהרמה הראשונה.

נספח – תרשים זרימה: היררכיית הידע בצ'אט

קליטת שאלה →
זיהוי כוונה →
בדיקת רמה 1 →
אם אין מענה → רמה 2 →
אם אין מענה → רמה 3 →
העשרה מרמות נוספות אם יש ערך →
תשובה סופית עם ציון מקור.

עקרונות מרכזיים:

עדיפות תמידית לרמה 1.
שקיפות מלאה בציון מקור.
אפשרות להעשיר מרמות אחרות.
תגובה מותאמת שפה וקהלי יעד.`
  }
];

const mockTerms: Term[] = [];

const mockKnowledge: Knowledge[] = [];

const KnowledgeManagement = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTermDialogOpen, setIsTermDialogOpen] = useState(false);
  const [isKnowledgeDialogOpen, setIsKnowledgeDialogOpen] = useState(false);
  const [isSystemInsightsOpen, setIsSystemInsightsOpen] = useState(false);
  
  // Documents from Supabase - moved inside component
  const [userDocs, setUserDocs] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUserDocs([]); setLoadingDocs(false); return; }

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mapped = data.map((row: any) => {
        const ext = (row.file_type || '').toLowerCase();
        const type: 'pdf' | 'video' | 'image' | 'doc' = ext === 'pdf' ? 'pdf' : (['jpg','jpeg','png'].includes(ext) ? 'image' : 'doc');
        const levelMap = row.level ?? (row.ai_determined_level === 'L1' ? 1 : row.ai_determined_level === 'L2' ? 2 : row.ai_determined_level === 'L3' ? 3 : 1);
        const sizeStr = row.file_size ? `${(row.file_size / 1024 / 1024).toFixed(2)} MB` : '—';
        return {
          id: row.id,
          title: row.title || row.filename,
          type,
          level: levelMap as 1 | 2 | 3,
          status: (row.status as any) || 'ממתין לאישור',
          unit: row.unit || '—',
          uploadedBy: 'אתה',
          uploadedAt: new Date(row.upload_date || row.created_at),
          size: sizeStr,
          tags: row.tags || [],
          confidence: row.confidence || undefined,
          reasons: row.reasons || undefined,
          notes: row.notes || undefined,
        } as Document;
      });
      setUserDocs(mapped);
    }

    setLoadingDocs(false);
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Button handlers
  const handleEdit = (id: string, title: string) => {
    toast({
      title: "עריכה",
      description: `נפתח עורך המסמכים עבור "${title}"`,
    });
  };

  const handleDownload = (id: string, title: string) => {
    toast({
      title: "הורדה",
      description: `הוורד "${title}" בהצלחה`,
    });
  };

  const handleApprove = async (id: string, title: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Update document status to approved
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'מאושר',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Trigger AI processing
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { documentId: id }
      });

      if (processError) {
        console.error('Processing error:', processError);
      }

      toast({
        title: "אושר בהצלחה",
        description: `המסמך "${title}" אושר ועובר כעת עיבוד AI`,
      });

      // Refresh the documents list
      fetchDocuments();
    } catch (error) {
      console.error('Approval error:', error);
      toast({
        title: "שגיאה באישור",
        description: "אירעה שגיאה בעת אישור המסמך",
        variant: "destructive",
      });
    }
  };

  const handleProcess = async (id: string, title: string) => {
    try {
      // Trigger AI processing
      const { error: processError } = await supabase.functions.invoke('process-document', {
        body: { documentId: id }
      });

      if (processError) {
        console.error('Processing error:', processError);
        toast({
          title: "שגיאה בעיבוד",
          description: "אירעה שגיאה בעת עיבוד המסמך",
          variant: "destructive",
        });
      } else {
        toast({
          title: "עיבוד מחדש הופעל",
          description: `המסמך "${title}" נשלח לעיבוד מחדש`,
        });
      }

      // Refresh the documents list
      fetchDocuments();
    } catch (error) {
      console.error('Processing error:', error);
      toast({
        title: "שגיאה בעיבוד",
        description: "אירעה שגיאה בעת עיבוד המסמך",
        variant: "destructive",
      });
    }
  };

  const handleReject = (id: string, title: string) => {
    toast({
      title: "נדחה",
      description: `המסמך "${title}" נדחה והוחזר לתיקון`,
      variant: "destructive",
    });
  };

  const handleUpload = () => {
    toast({
      title: "הועלה בהצלחה",
      description: "המסמך נשלח לבדיקה ואישור",
    });
    setIsUploadOpen(false);
  };

  const handleAddTerm = () => {
    toast({
      title: "מונח נוסף",
      description: "המונח נוסף למילון בהצלחה",
    });
    setIsTermDialogOpen(false);
  };

  // Utility functions
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf': case 'doc': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'מאושר': return <CheckCircle className="h-4 w-4 text-success" />;
      case 'ממתין לאישור': return <AlertCircle className="h-4 w-4 text-warning" />;
      case 'נדחה': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDocumentTypeIcon = (type: 'organizational' | 'unit') => {
    switch (type) {
      case 'organizational': return <Building2 className="h-4 w-4 text-green-600" />;
      case 'unit': return <User className="h-4 w-4 text-blue-600" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getDocumentTypeBadge = (doc: SystemDocument) => {
    if (doc.type === 'organizational') {
      return <Badge className="bg-green-100 text-green-800 border-green-200">מסמך ליבה ארגוני</Badge>;
    } else {
      return doc.status === 'pending' 
        ? <Badge className="bg-purple-100 text-purple-800 border-purple-200">ממתין לאישור</Badge>
        : <Badge className="bg-blue-100 text-blue-800 border-blue-200">מסמך ליבה יחידתי</Badge>;
    }
  };

  const filteredDocuments = userDocs.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || doc.level.toString() === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  // Filter system docs to only show organizational (core) documents
  const filteredSystemDocs = mockSystemDocs.filter(doc => doc.type === 'organizational');
  
  // Add unit docs to content documents with special marking
  const allContentDocuments = [
    ...filteredDocuments,
    ...mockSystemDocs.filter(doc => doc.type === 'unit').map(doc => ({
      id: doc.id,
      title: doc.title,
      type: 'doc' as const,
      level: 1 as const, // Unit docs are treated as level 1
      status: doc.status === 'active' ? 'מאושר' as const : 'ממתין לאישור' as const,
      unit: doc.unitName || 'יחידתי',
      uploadedBy: doc.updatedBy,
      uploadedAt: doc.lastUpdated,
      size: doc.size,
      tags: ['מסמך יחידתי'],
      isUnitDoc: true
    }))
  ].filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || doc.level.toString() === selectedLevel;
    const matchesStatus = selectedStatus === 'all' || doc.status === selectedStatus;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const pendingDocs = userDocs.filter(doc => doc.status === 'ממתין לאישור');

  // Calculate AI processing status
  const totalApprovedDocs = userDocs.filter(doc => doc.status === 'מאושר').length;
  const processedDocs = userDocs.filter(doc => 
    doc.status === 'מאושר' && 
    doc.confidence !== undefined // This indicates AI processing completed
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* System Insights Window */}
        {isSystemInsightsOpen && (
          <SystemInsightsWindow onClose={() => setIsSystemInsightsOpen(false)} />
        )}
        
        {/* AI Processing Status Card */}
        <div className="mb-6">
          <ProcessingStatusCard 
            totalDocuments={totalApprovedDocs}
            processedDocuments={processedDocs}
            onRefresh={fetchDocuments}
          />
        </div>
        
        <div className="flex justify-between items-center mb-6" dir="rtl">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold text-foreground">ניהול ידע</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setIsSystemInsightsOpen(true)}
              className="gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              תובנות מערכת
            </Button>
          </div>
        </div>
        <Tabs defaultValue="system" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="gap-2 text-green-600">
              <FileText className="h-4 w-4" />
              מסמכי ליבה
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="h-4 w-4" />
              מסמכי תוכן (רמות 1-3)
            </TabsTrigger>
            <TabsTrigger value="language">
              <MessageCircle className="h-4 w-4" />
              שפת פק״ל
            </TabsTrigger>
          </TabsList>


          {/* Core Documents Tab */}
          <TabsContent value="system" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-foreground" />
                    <div>
                      <CardTitle>מסמכי ליבה</CardTitle>
                      <p className="text-sm text-muted-foreground">מסמכים המגדירים את זהות והתנהגות הארגון והיחידות</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {filteredSystemDocs.map((doc) => (
                    <Card key={doc.id} className={`border-2 ${
                      doc.type === 'organizational' 
                        ? 'border-green-200 bg-green-50' 
                        : doc.status === 'pending'
                        ? 'border-purple-200 bg-purple-50'
                        : 'border-blue-200 bg-blue-50'
                    }`}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {getDocumentTypeIcon(doc.type)}
                            <div>
                              <h3 className="font-semibold text-lg">מסמך ליבה</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {getDocumentTypeBadge(doc)}
                                <span>•</span>
                                <span>גרסה {doc.version}</span>
                                <span>•</span>
                                <span>עודכן ב-{doc.lastUpdated.toLocaleDateString('he-IL')}</span>
                                <span>•</span>
                                <span>נערך ע״י {doc.updatedBy}</span>
                                <span>•</span>
                                <span>{doc.size}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="gap-2"
                              onClick={() => handleEdit(doc.id, doc.title)}
                            >
                              <Edit className="h-4 w-4" />
                              עריכה
                            </Button>
                            {doc.status === 'pending' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2 text-green-600 border-green-600"
                                  onClick={() => handleApprove(doc.id, doc.title)}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  אישור
                                </Button>
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="gap-2 text-red-600 border-red-600"
                                  onClick={() => handleReject(doc.id, doc.title)}
                                >
                                  <XCircle className="h-4 w-4" />
                                  דחייה
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleDownload(doc.id, doc.title)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Document Content */}
                        <Accordion type="single" collapsible className="w-full" defaultValue="content">
                          <AccordionItem value="content" className="border-none">
                            <AccordionTrigger className="hover:no-underline py-2">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                תוכן
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2" dir="rtl">
                              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                <div className="p-3 bg-muted/50 border rounded-lg">
                                  <h4 className="font-semibold mb-2">תוכן המסמך</h4>
                                   <div className="bg-background p-3 rounded text-sm whitespace-pre-wrap">
                                     {doc.content || (doc.type === 'organizational' ? (
                                       `📘 מסמך ליבה – פק״ל במילואים 2025

פרק 1 – עקרונות ותהליכי עבודה של הארגון

מטרת פק״ל
פק״ל – פלוגה, קהילה, לכידות – היא תוכנית לאומית לפיתוח יחידות מילואים כקהילות מלוכדות.
הארגון פועל מתוך תפיסה הרואה את יחידת המילואים כקהילה.
המטרה: חיזוק הזהות, המשמעות, הקשרים והערך של השירות המילואימניקי, בצבא ובחברה האזרחית.

שותפים וייחודיות
פועל בשיתוף אכ״א, קמל״ר, בה״ד לפיתוח מנהיגות, וקרן מיראז׳ ישראל.
צוות המנחים כולם משרתי מילואים פעילים בעלי ניסיון כפול – גם כמפקדים/חיילים, וגם כאנשי מקצוע מעולמות בניית קהילה.

שלושת מישורי הפעולה המרכזיים
1. לכידות יחידתית – הכשרת "ציר לכידות" בכל יחידה, סיוע בתכנון ויישום תוכניות חיזוק לכידות
2. עורף משפחתי – ליווי והקמת קהילות עורף (בני/בנות זוג ומשפחות)
3. מנהיגות מילואימניקית – מתן כלים פיקודיים ומנהיגותיים מותאמים לאתגרים הייחודיים

פרק 4 – היררכיית הידע
רמה 1 – תוכן ייחודי לפק״ל: אוגדנים, חזון, מדריכים מקוריים (עדיפות מוחלטת)
רמה 2 – כלים והדרכות: כרטיסיות פעילות, מדריכי הכשרה, נהלים
רמה 3 – העמקה ומחקר: מקורות חיצוניים להרחבת הקשר בלבד

עקרון נימוקים: כל תשובה כוללת סימון מקור והרמה`
                                     ) : (
                                       `🗂️ מסמך מיפוי יחידתי - ${doc.unitName}

אוגדן מידע מפורט להבנה עמוקה של ${doc.unitName}

1. פרטי זיהוי בסיסיים
זיהוי היחידה, אנשי קשר עיקריים, פרטי תקשורת

2. מבנה כוח האדם  
מספר חיילים, חלוקה לדרגות ותפקידים, מבנה מחלקות וצוותים

3. פרופיל חברתי־קהילתי
גילאי החיילים, מצב משפחתי, אזורי מגורים, רמת הכרות בין החיילים

4. מאפיינים אישיים חשובים
העדפות פעילות, צרכים מיוחדים, נקודות רגישות שיש להתחשב בהן

5. כישורים ויכולות
מקצועות אזרחיים, ניסיון צבאי, חוזקות קבוצתיות ייחודיות

6. היסטוריית פעילות
אירועי גיבוש קודמים, פעילויות פק״ל שנעשו, הצלחות ואתגרים מהעבר

7. תובנות ויעדים
רמת לכידות נוכחית, יעדים לפעילות קרובה, נושאים מומלצים לטיפול

🎯 מטרת המסמך: לאפשר למנחי ומלווי פק״ל להבין את ${doc.unitName} ברמה עמוקה 
ולהתאים פעילויות וסדנאות לצורכי היחידה הספציפיים`
                                     ))}
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Documents Tab - L1, L2, L3 */}
          <TabsContent value="documents" className="space-y-4">
            {/* Content Level Explanation */}
            <div className="p-4 bg-muted/30 border border-border rounded-lg mb-4" dir="rtl">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-foreground" />
                <h3 className="font-semibold text-foreground">מסמכי התוכן - רמות 1-3</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <Target className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">רמה 1:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">תוכן ייחודי לפק״ל - עדיפות מוחלטת</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <BookOpenCheck className="h-4 w-4 text-accent" />
                    <span className="font-medium text-sm">רמה 2:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">כלים והדרכות - תמיכה מעשית</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex items-center gap-2 min-w-[60px]">
                    <ScrollText className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-sm">רמה 3:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">מחקר והעמקה - רקע נוסף</p>
                </div>
              </div>
            </div>

            {/* Search and Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  מסמכי תוכן
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6" dir="rtl">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="חיפוש מסמכים..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pr-8"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הרמות</SelectItem>
                      <SelectItem value="1">רמה 1</SelectItem>
                      <SelectItem value="2">רמה 2</SelectItem>
                      <SelectItem value="3">רמה 3</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הסטטוסים</SelectItem>
                      <SelectItem value="מאושר">מאושר</SelectItem>
                      <SelectItem value="ממתין לאישור">ממתין לאישור</SelectItem>
                      <SelectItem value="טיוטה">טיוטה</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button className="gap-2" onClick={() => setIsUploadOpen(true)}>
                    <Upload className="h-4 w-4" />
                    העלאת מסמך
                  </Button>
                </div>

                <div className="space-y-4">
                  {allContentDocuments.map((doc) => (
                    <div key={doc.id} className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${(doc as any).isUnitDoc ? 'border-amber-300 bg-amber-50' : ''}`} dir="rtl">
                      <div className="flex items-center gap-4">
                        {getTypeIcon(doc.type)}
                        {(doc as any).isUnitDoc && <Star className="h-4 w-4 text-amber-500 fill-amber-500" />}
                        
                        <div className="flex-1">
                          <h3 className="font-medium mb-1">{doc.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {!(doc as any).isUnitDoc && (
                              <Badge variant={doc.level === 1 ? "default" : doc.level === 2 ? "secondary" : "outline"}>
                                רמה {doc.level}
                              </Badge>
                            )}
                            {(doc as any).isUnitDoc && <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">מסמך יחידתי</Badge>}
                            <span>{doc.unit}</span>
                            <span>{doc.uploadedAt.toLocaleDateString('he-IL')}</span>
                            <span>{doc.size}</span>
                            <span>על ידי {doc.uploadedBy}</span>
                          </div>
                        </div>
                      </div>
                      
                       <div className="flex items-center gap-2">
                         {getStatusIcon(doc.status)}
                         {doc.status === 'ממתין לאישור' && (
                           <>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="gap-2 text-green-600 border-green-600"
                               onClick={() => handleApprove(doc.id, doc.title)}
                             >
                               <CheckCircle className="h-4 w-4" />
                               אישור
                             </Button>
                             <Button 
                               variant="outline" 
                               size="sm" 
                               className="gap-2 text-red-600 border-red-600"
                               onClick={() => handleReject(doc.id, doc.title)}
                             >
                               <XCircle className="h-4 w-4" />
                               דחייה
                             </Button>
                           </>
                         )}
                         {doc.status === 'מאושר' && !(doc as any).isUnitDoc && (
                           <Button 
                             variant="outline" 
                             size="sm" 
                             className="gap-2 text-blue-600 border-blue-600"
                             onClick={() => handleProcess(doc.id, doc.title)}
                           >
                             <AlertCircle className="h-4 w-4" />
                             עיבוד מחדש
                           </Button>
                         )}
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => handleEdit(doc.id, doc.title)}
                         >
                           <Edit className="h-4 w-4" />
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm"
                           onClick={() => handleDownload(doc.id, doc.title)}
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                       </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Language Tab - Dictionary */}
          <TabsContent value="language" className="space-y-4">
            <div className="grid gap-6">
              {/* Dictionary */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5" />
                      מילון מונחים
                    </CardTitle>
                    <Dialog open={isTermDialogOpen} onOpenChange={setIsTermDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Plus className="h-4 w-4" />
                          הוסף מונח
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md" dir="rtl">
                        <DialogHeader>
                          <DialogTitle>הוספת מונח חדש</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>מונח</Label>
                            <Input placeholder="הכנס מונח..." />
                          </div>
                          <div>
                            <Label>הגדרה</Label>
                            <Textarea placeholder="הכנס הגדרה..." rows={3} />
                          </div>
                          <div>
                            <Label>דוגמה</Label>
                            <Input placeholder="הכנס דוגמה..." />
                          </div>
                          <div>
                            <Label>קטגוריה</Label>
                            <Select>
                              <SelectTrigger>
                                <SelectValue placeholder="בחר קטגוריה" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ערכים">ערכים</SelectItem>
                                <SelectItem value="מנהיגות">מנהיגות</SelectItem>
                                <SelectItem value="מבצעי">מבצעי</SelectItem>
                                <SelectItem value="הכשרה">הכשרה</SelectItem>
                                <SelectItem value="תקשורת">תקשורת</SelectItem>
                                <SelectItem value="בטיחות">בטיחות</SelectItem>
                                <SelectItem value="פיתוח">פיתוח</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex gap-2" dir="rtl">
                            <Button variant="outline" onClick={() => setIsTermDialogOpen(false)}>ביטול</Button>
                            <Button className="flex-1" onClick={handleAddTerm}>הוסף מונח</Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="relative">
                      <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="חיפוש מונחים..." className="pr-8" />
                    </div>
                  </div>
                  
                  <div className="grid gap-4">
                    {mockTerms.map((term) => (
                      <div key={term.id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors" dir="rtl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{term.term}</h3>
                            <Badge variant="outline">{term.category}</Badge>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className="text-sm mb-2">{term.definition}</p>
                        
                        {term.example && (
                          <div className="p-2 bg-muted/50 border rounded text-sm mb-2">
                            <span className="font-medium">דוגמה: </span>
                            {term.example}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex gap-2">
                            {term.sources.map((source, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">{source}</Badge>
                            ))}
                          </div>
                          <span>עודכן ב-{term.lastUpdated.toLocaleDateString('he-IL')} ע״י {term.updatedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Upload Modal */}
        <UploadModal 
          isOpen={isUploadOpen} 
          onClose={() => setIsUploadOpen(false)} 
        />
      </div>
    </div>
  );
};

export default KnowledgeManagement;