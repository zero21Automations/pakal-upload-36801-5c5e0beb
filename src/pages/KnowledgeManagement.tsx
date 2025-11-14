import { useState, useEffect } from "react";
import { SystemInsightsWindow } from "@/components/SystemInsightsWindow";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  FileText, 
  Upload, 
  Edit, 
  CheckCircle, 
  XCircle, 
  BookOpen,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";

interface CoreDocument {
  id: string;
  title: string;
  content: string;
  version: number;
  updated_at: string;
  updated_by: string;
}

interface ContentDocument {
  id: string;
  title: string;
  filename: string;
  document_level: string | null;
  document_type: string;
  status: string;
  created_at: string;
  file_size: number;
}

export default function KnowledgeManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Core document state
  const [coreDoc, setCoreDoc] = useState<CoreDocument | null>(null);
  const [isEditingCore, setIsEditingCore] = useState(false);
  const [editedCoreContent, setEditedCoreContent] = useState("");
  const [loadingCoreDoc, setLoadingCoreDoc] = useState(true);
  
  // Core document upload state
  const [isUploadCoreDialogOpen, setIsUploadCoreDialogOpen] = useState(false);
  const [coreDocFile, setCoreDocFile] = useState<File | null>(null);
  const [uploadingCore, setUploadingCore] = useState(false);
  
  // Content documents state
  const [contentDocs, setContentDocs] = useState<ContentDocument[]>([]);
  const [loadingContentDocs, setLoadingContentDocs] = useState(true);
  const [isUploadContentDialogOpen, setIsUploadContentDialogOpen] = useState(false);
  const [contentDocFile, setContentDocFile] = useState<File | null>(null);
  const [contentDocLevel, setContentDocLevel] = useState<string>("L1");
  const [uploadingContent, setUploadingContent] = useState(false);

  // System insights state
  const [isSystemInsightsOpen, setIsSystemInsightsOpen] = useState(false);

  // Load core document
  useEffect(() => {
    fetchCoreDocument();
  }, []);

  // Load content documents
  useEffect(() => {
    fetchContentDocuments();
  }, []);

  const fetchCoreDocument = async () => {
    try {
      const { data, error } = await supabase
        .from('core_documents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCoreDoc(data);
        setEditedCoreContent(data.content);
      }
    } catch (error) {
      console.error('Error fetching core document:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון את מסמך הליבה",
        variant: "destructive",
      });
    } finally {
      setLoadingCoreDoc(false);
    }
  };

  const fetchContentDocuments = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'content')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentDocs(data || []);
    } catch (error) {
      console.error('Error fetching content documents:', error);
    } finally {
      setLoadingContentDocs(false);
    }
  };

  const handleSaveCoreDoc = async () => {
    if (!user || !editedCoreContent.trim()) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור מסמך ריק",
        variant: "destructive",
      });
      return;
    }

    try {
      if (coreDoc) {
        // Update existing document
        const { error } = await supabase
          .from('core_documents')
          .update({
            content: editedCoreContent,
            version: coreDoc.version + 1,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', coreDoc.id);

        if (error) throw error;
      } else {
        // Create new document
        const { error } = await supabase
          .from('core_documents')
          .insert({
            title: 'מסמך ליבה – פק״ל במילואים 2025',
            content: editedCoreContent,
            updated_by: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: "נשמר בהצלחה",
        description: "מסמך הליבה עודכן במערכת",
      });

      setIsEditingCore(false);
      fetchCoreDocument();
    } catch (error) {
      console.error('Error saving core document:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את מסמך הליבה",
        variant: "destructive",
      });
    }
  };

  const handleUploadCoreDoc = async () => {
    if (!coreDocFile || !user) {
      toast({
        title: "שגיאה",
        description: "נא לבחור קובץ",
        variant: "destructive",
      });
      return;
    }

    setUploadingCore(true);
    try {
      // Read file content
      const text = await coreDocFile.text();
      
      if (coreDoc) {
        // Update existing
        const { error } = await supabase
          .from('core_documents')
          .update({
            content: text,
            version: coreDoc.version + 1,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', coreDoc.id);

        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from('core_documents')
          .insert({
            title: 'מסמך ליבה – פק״ל במילואים 2025',
            content: text,
            updated_by: user.id,
          });

        if (error) throw error;
      }

      toast({
        title: "הועלה בהצלחה",
        description: "מסמך הליבה הועלה ועודכן במערכת",
      });

      setIsUploadCoreDialogOpen(false);
      setCoreDocFile(null);
      fetchCoreDocument();
    } catch (error) {
      console.error('Error uploading core document:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להעלות את מסמך הליבה",
        variant: "destructive",
      });
    } finally {
      setUploadingCore(false);
    }
  };

  const handleUploadContentDoc = async () => {
    if (!contentDocFile || !user) {
      toast({
        title: "שגיאה",
        description: "נא לבחור קובץ",
        variant: "destructive",
      });
      return;
    }

    setUploadingContent(true);
    try {
      // Upload file to storage
      const filePath = `${user.id}/${Date.now()}_${contentDocFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, contentDocFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: insertError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: contentDocFile.name.replace(/\.[^/.]+$/, ''),
          filename: contentDocFile.name,
          file_path: filePath,
          file_size: contentDocFile.size,
          file_type: contentDocFile.name.split('.').pop() || 'unknown',
          document_type: 'content',
          document_level: contentDocLevel,
          status: 'ממתין לאישור',
        });

      if (insertError) throw insertError;

      toast({
        title: "הועלה בהצלחה",
        description: `מסמך תוכן ברמה ${contentDocLevel} נוסף למערכת`,
      });

      setIsUploadContentDialogOpen(false);
      setContentDocFile(null);
      setContentDocLevel("L1");
      fetchContentDocuments();
    } catch (error) {
      console.error('Error uploading content document:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להעלות את מסמך התוכן",
        variant: "destructive",
      });
    } finally {
      setUploadingContent(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">ניהול ידע</h1>
            <p className="text-muted-foreground">ניהול מסמכי ליבה ומסמכי תוכן</p>
          </div>
          <Button 
            onClick={() => setIsSystemInsightsOpen(true)}
            variant="outline"
          >
            <BookOpen className="h-4 w-4 ml-2" />
            תובנות מערכת
          </Button>
        </div>

        <Tabs defaultValue="core" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="core">מסמך ליבה</TabsTrigger>
            <TabsTrigger value="content">מסמכי תוכן</TabsTrigger>
          </TabsList>

          {/* Core Document Tab */}
          <TabsContent value="core" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    מסמך ליבה – פק״ל במילואים 2025
                  </CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={isUploadCoreDialogOpen} onOpenChange={setIsUploadCoreDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 ml-1" />
                          העלה מסמך
                        </Button>
                      </DialogTrigger>
                      <DialogContent dir="rtl">
                        <DialogHeader>
                          <DialogTitle>העלאת מסמך ליבה</DialogTitle>
                          <DialogDescription>
                            העלה קובץ טקסט חדש למסמך הליבה
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <Input
                            type="file"
                            accept=".txt,.md,.doc,.docx"
                            onChange={(e) => setCoreDocFile(e.target.files?.[0] || null)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsUploadCoreDialogOpen(false)}
                            >
                              ביטול
                            </Button>
                            <Button
                              onClick={handleUploadCoreDoc}
                              disabled={!coreDocFile || uploadingCore}
                            >
                              {uploadingCore ? "מעלה..." : "העלה"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {!isEditingCore ? (
                      <Button size="sm" onClick={() => setIsEditingCore(true)}>
                        <Edit className="h-4 w-4 ml-1" />
                        ערוך
                      </Button>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => {
                          setIsEditingCore(false);
                          setEditedCoreContent(coreDoc?.content || "");
                        }}>
                          <XCircle className="h-4 w-4 ml-1" />
                          ביטול
                        </Button>
                        <Button size="sm" onClick={handleSaveCoreDoc}>
                          <CheckCircle className="h-4 w-4 ml-1" />
                          שמור
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingCoreDoc ? (
                  <div className="text-center py-8 text-muted-foreground">טוען...</div>
                ) : isEditingCore ? (
                  <Textarea
                    value={editedCoreContent}
                    onChange={(e) => setEditedCoreContent(e.target.value)}
                    className="min-h-[500px] font-mono text-sm"
                    dir="rtl"
                  />
                ) : (
                  <div className="bg-muted/30 p-6 rounded-lg">
                    {coreDoc ? (
                      <>
                        <div className="flex items-center gap-2 mb-4">
                          <Badge variant="secondary">גרסה {coreDoc.version}</Badge>
                          <span className="text-xs text-muted-foreground">
                            עודכן: {new Date(coreDoc.updated_at).toLocaleDateString('he-IL')}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm leading-relaxed">
                          {coreDoc.content}
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>אין מסמך ליבה. לחץ על "ערוך" או "העלה מסמך" כדי להוסיף.</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Documents Tab */}
          <TabsContent value="content" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>מסמכי תוכן</CardTitle>
                  <Dialog open={isUploadContentDialogOpen} onOpenChange={setIsUploadContentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 ml-1" />
                        העלה מסמך תוכן
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>העלאת מסמך תוכן</DialogTitle>
                        <DialogDescription>
                          העלה מסמך תוכן חדש וקבע את רמת הידע שלו
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">בחר קובץ</label>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.txt,.md"
                            onChange={(e) => setContentDocFile(e.target.files?.[0] || null)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">רמת ידע</label>
                          <Select value={contentDocLevel} onValueChange={setContentDocLevel}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="L1">L1 - מסמכי ליבה פק"לים</SelectItem>
                              <SelectItem value="L2">L2 - כלים ופעילויות</SelectItem>
                              <SelectItem value="L3">L3 - מחקר והרחבה</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsUploadContentDialogOpen(false)}
                          >
                            ביטול
                          </Button>
                          <Button
                            onClick={handleUploadContentDoc}
                            disabled={!contentDocFile || uploadingContent}
                          >
                            {uploadingContent ? "מעלה..." : "העלה"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {loadingContentDocs ? (
                  <div className="text-center py-8 text-muted-foreground">טוען...</div>
                ) : contentDocs.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>אין מסמכי תוכן. לחץ על "העלה מסמך תוכן" כדי להתחיל.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contentDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <h3 className="font-medium">{doc.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={doc.document_level === 'L1' ? 'default' : doc.document_level === 'L2' ? 'secondary' : 'outline'}>
                                {doc.document_level || 'לא מוגדר'}
                              </Badge>
                              <Badge variant={doc.status === 'מאושר' ? 'default' : 'secondary'}>
                                {doc.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.created_at).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isSystemInsightsOpen && (
        <SystemInsightsWindow
          onClose={() => setIsSystemInsightsOpen(false)}
        />
      )}
    </div>
  );
}
