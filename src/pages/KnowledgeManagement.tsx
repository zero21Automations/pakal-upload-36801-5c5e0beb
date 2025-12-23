import { useState, useEffect, useMemo, useRef } from "react";
import { SystemInsightsWindow } from "@/components/SystemInsightsWindow";
import { Navigation } from "@/components/Navigation";
import { DocumentPreview } from "@/components/DocumentPreview";
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
  Plus,
  Search,
  Download,
  Filter,
  PlayCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { ProcessingStatusBadge } from "@/components/ProcessingStatusBadge";

interface CoreDocument {
  id: string;
  title: string;
  content: string;
  version: number;
  updated_at: string;
  updated_by: string;
  processing_status?: string;
  processed_at?: string;
  processing_error?: string;
  chunks_count?: number;
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
  processing_status?: string;
  processed_at?: string;
  processing_error?: string;
  chunks_count?: number;
}

interface PakalTerm {
  id: string;
  term: string;
  definition: string;
  category: string | null;
  created_at: string;
  created_by: string;
}

export default function KnowledgeManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { role } = useUserRole();
  const isMentor = role === 'mentor';
  
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
  const [isEditContentDialogOpen, setIsEditContentDialogOpen] = useState(false);
  const [editingContentDoc, setEditingContentDoc] = useState<ContentDocument | null>(null);
  
  // Document preview state
  const [isPreviewingContent, setIsPreviewingContent] = useState(false);
  const [contentPreview, setContentPreview] = useState<any>(null);
  const [isPreviewingCore, setIsPreviewingCore] = useState(false);
  const [corePreview, setCorePreview] = useState<any>(null);

  // Manual processing state
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  
  // Polling interval ref
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pakal terms state
  const [pakalTerms, setPakalTerms] = useState<PakalTerm[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(true);
  const [isAddTermDialogOpen, setIsAddTermDialogOpen] = useState(false);
  const [isEditTermDialogOpen, setIsEditTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<PakalTerm | null>(null);
  const [newTerm, setNewTerm] = useState({ term: "", definition: "", category: "" });
  const [savingTerm, setSavingTerm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // System insights state
  const [isSystemInsightsOpen, setIsSystemInsightsOpen] = useState(false);
  const [syncingPadlet, setSyncingPadlet] = useState(false);
  const [purgingPadlet, setPurgingPadlet] = useState(false);
  const [analytics, setAnalytics] = useState({
    totalDocuments: 0,
    pendingApprovals: 0,
    lastUpdate: "-",
    levelDistribution: {
      core: 0,
      l1: 0,
      l2: 0,
      l3: 0,
    },
  });

  // Helper to format document level for display
  const formatDocLevel = (level: string | null): string => {
    if (!level) return 'לא מוגדר';
    return level.replace('L', 'רמה ');
  };

  // Load core document
  useEffect(() => {
    fetchCoreDocument();
  }, []);

  // Load content documents
  useEffect(() => {
    fetchContentDocuments();
  }, []);

  // Load pakal terms
  useEffect(() => {
    fetchPakalTerms();
  }, []);

  // Fetch analytics data
  useEffect(() => {
    fetchAnalytics();
  }, [contentDocs, coreDoc]);

  const fetchAnalytics = async () => {
    try {
      // Count documents by status
      const pendingDocs = contentDocs.filter(doc => doc.status === 'ממתין לאישור').length;
      
      // Count documents by level
      const levelCounts = {
        core: coreDoc ? 1 : 0,
        l1: contentDocs.filter(doc => doc.document_level === 'L1').length,
        l2: contentDocs.filter(doc => doc.document_level === 'L2').length,
        l3: contentDocs.filter(doc => doc.document_level === 'L3').length,
      };
      
      // Get last update time
      const allDates = [
        ...contentDocs.map(doc => new Date(doc.created_at)),
        ...(coreDoc ? [new Date(coreDoc.updated_at)] : [])
      ];
      const lastUpdate = allDates.length > 0 
        ? new Date(Math.max(...allDates.map(d => d.getTime())))
        : null;
      
      const formatLastUpdate = (date: Date | null) => {
        if (!date) return "-";
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return "כרגע";
        if (diffMins < 60) return `לפני ${diffMins} דקות`;
        if (diffHours < 24) return `לפני ${diffHours} שעות`;
        return `לפני ${diffDays} ימים`;
      };

      setAnalytics({
        totalDocuments: contentDocs.length + (coreDoc ? 1 : 0),
        pendingApprovals: pendingDocs,
        lastUpdate: formatLastUpdate(lastUpdate),
        levelDistribution: levelCounts,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  // Preview disabled temporarily
  // useEffect(() => {
  //   if (contentDocFile && !contentPreview) {
  //     handlePreviewContentDoc();
  //   }
  // }, [contentDocFile]);

  // Real-time subscription for core documents processing status
  useEffect(() => {
    if (!coreDoc) return;

    const channel = supabase
      .channel('core-document-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'core_documents',
          filter: `id=eq.${coreDoc.id}`
        },
        (payload) => {
          console.log('Core document updated:', payload);
          setCoreDoc(payload.new as CoreDocument);
          
          // Show toast for completed/failed processing
          if (payload.new.processing_status === 'completed') {
            toast({
              title: "עיבוד הושלם",
              description: `מסמך הליבה עובד בהצלחה. ${payload.new.chunks_count} קטעים נוצרו.`,
            });
          } else if (payload.new.processing_status === 'failed') {
            toast({
              title: "עיבוד נכשל",
              description: payload.new.processing_error || "אירעה שגיאה בעיבוד המסמך",
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coreDoc?.id]);

  // Real-time subscription for content documents processing status
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('content-documents-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'documents',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Content document updated:', payload);
          
          // Update the document in the list
          setContentDocs(prev => 
            prev.map(doc => 
              doc.id === payload.new.id ? payload.new as ContentDocument : doc
            )
          );
          
          // Show toast for completed/failed processing
          if (payload.new.processing_status === 'completed') {
            toast({
              title: "עיבוד הושלם",
              description: `${payload.new.title} עובד בהצלחה. ${payload.new.chunks_count} קטעים נוצרו.`,
            });
          } else if (payload.new.processing_status === 'failed') {
            toast({
              title: "עיבוד נכשל",
              description: `${payload.new.title}: ${payload.new.processing_error || "שגיאה"}`,
              variant: "destructive",
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Polling fallback for processing documents
  useEffect(() => {
    const hasProcessingDocs = contentDocs.some(doc => 
      ['pending', 'extracting', 'classifying', 'embedding', 'processing'].includes(doc.processing_status || '')
    ) || (coreDoc && ['pending', 'extracting', 'classifying', 'embedding', 'processing'].includes(coreDoc.processing_status || ''));

    if (hasProcessingDocs && !pollingIntervalRef.current) {
      // Start polling every 3 seconds
      pollingIntervalRef.current = setInterval(() => {
        console.log('Polling for document updates...');
        fetchContentDocuments();
        if (coreDoc) fetchCoreDocument();
      }, 3000);
    } else if (!hasProcessingDocs && pollingIntervalRef.current) {
      // Stop polling when no documents are processing
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [contentDocs, coreDoc, user]);

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
        .in('document_type', ['content', 'padlet'])
        .in('status', ['מאושר', 'ממתין לאישור'])
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
      // Extract text content using preview-document function
      const formData = new FormData();
      formData.append('file', coreDocFile);
      
      const { data: previewData, error: previewError } = await supabase.functions.invoke('preview-document', {
        body: formData
      });
      
      if (previewError || !previewData?.fullContent) {
        throw new Error('Failed to extract text from file');
      }
      
      const text = previewData.fullContent;
      
      if (!text || text.trim().length < 10) {
        throw new Error('No meaningful content extracted from file');
      }
      
      let coreDocId = coreDoc?.id;
      
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
        const { data, error } = await supabase
          .from('core_documents')
          .insert({
            title: 'מסמך ליבה – פק״ל במילואים 2025',
            content: text,
            updated_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;
        coreDocId = data.id;
      }

      // Trigger processing for embeddings
      if (coreDocId) {
        try {
          await supabase.functions.invoke('process-core-document', {
            body: { coreDocId }
          });
          console.log('Core document processing triggered');
        } catch (procError) {
          console.error('Error triggering processing:', procError);
        }
      }

      toast({
        title: "הועלה בהצלחה",
        description: "מסמך הליבה הועלה ועודכן במערכת. מעבד עכשיו...",
      });

      setIsUploadCoreDialogOpen(false);
      setCoreDocFile(null);
      fetchCoreDocument();
    } catch (error) {
      console.error('Error uploading core document:', error);
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "לא ניתן להעלות את מסמך הליבה",
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
      const { data: docData, error: insertError } = await supabase
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
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger processing for embeddings
      if (docData) {
        try {
          await supabase.functions.invoke('trigger-document-processing', {
            body: { documentId: docData.id }
          });
          console.log('Document processing triggered');
        } catch (procError) {
          console.error('Error triggering processing:', procError);
          // Don't fail the upload if processing fails
        }
      }

      const levelLabel = formatDocLevel(contentDocLevel);
      toast({
        title: "הועלה בהצלחה",
        description: `מסמך תוכן ב${levelLabel} נוסף למערכת. מעבד עכשיו...`,
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

  const fetchPakalTerms = async () => {
    try {
      const { data, error } = await supabase
        .from('pakal_terms')
        .select('*')
        .order('term', { ascending: true });

      if (error) throw error;
      setPakalTerms(data || []);
    } catch (error) {
      console.error('Error fetching pakal terms:', error);
    } finally {
      setLoadingTerms(false);
    }
  };

  const handleAddTerm = async () => {
    if (!user || !newTerm.term.trim() || !newTerm.definition.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא את המונח והגדרה",
        variant: "destructive",
      });
      return;
    }

    setSavingTerm(true);
    try {
      const { error } = await supabase
        .from('pakal_terms')
        .insert({
          term: newTerm.term,
          definition: newTerm.definition,
          category: newTerm.category || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "נשמר בהצלחה",
        description: "המונח נוסף למילון",
      });

      setIsAddTermDialogOpen(false);
      setNewTerm({ term: "", definition: "", category: "" });
      fetchPakalTerms();
    } catch (error) {
      console.error('Error adding term:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את המונח",
        variant: "destructive",
      });
    } finally {
      setSavingTerm(false);
    }
  };

  const handleEditTerm = async () => {
    if (!editingTerm || !editingTerm.term.trim() || !editingTerm.definition.trim()) {
      toast({
        title: "שגיאה",
        description: "נא למלא את המונח והגדרה",
        variant: "destructive",
      });
      return;
    }

    setSavingTerm(true);
    try {
      const { error } = await supabase
        .from('pakal_terms')
        .update({
          term: editingTerm.term,
          definition: editingTerm.definition,
          category: editingTerm.category || null,
        })
        .eq('id', editingTerm.id);

      if (error) throw error;

      toast({
        title: "עודכן בהצלחה",
        description: "המונח עודכן במילון",
      });

      setIsEditTermDialogOpen(false);
      setEditingTerm(null);
      fetchPakalTerms();
    } catch (error) {
      console.error('Error editing term:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את המונח",
        variant: "destructive",
      });
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteTerm = async (termId: string) => {
    try {
      const { error } = await supabase
        .from('pakal_terms')
        .delete()
        .eq('id', termId);

      if (error) throw error;

      toast({
        title: "נמחק בהצלחה",
        description: "המונח הוסר מהמילון",
      });

      fetchPakalTerms();
    } catch (error) {
      console.error('Error deleting term:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את המונח",
        variant: "destructive",
      });
    }
  };

  const handleEditContentDoc = async () => {
    if (!editingContentDoc || !user) return;

    setSavingTerm(true);
    try {
      const { error } = await supabase
        .from('documents')
        .update({
          title: editingContentDoc.title,
          document_level: editingContentDoc.document_level,
          status: editingContentDoc.status,
        })
        .eq('id', editingContentDoc.id);

      if (error) throw error;

      setContentDocs(contentDocs.map(doc => 
        doc.id === editingContentDoc.id ? editingContentDoc : doc
      ));
      setIsEditContentDialogOpen(false);
      setEditingContentDoc(null);
      toast({
        title: "המסמך עודכן בהצלחה",
      });
    } catch (error) {
      console.error('Error updating content document:', error);
      toast({
        title: "שגיאה בעדכון המסמך",
        variant: "destructive",
      });
    } finally {
      setSavingTerm(false);
    }
  };

  const handleDeleteContentDoc = async (docId: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק מסמך זה?')) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-documents', {
        body: { action: 'delete', documentId: docId }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to delete document');
      }

      setContentDocs(contentDocs.filter(d => d.id !== docId));
      toast({
        title: "המסמך נמחק בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting content document:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      toast({
        title: "שגיאה במחיקת המסמך",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDeleteCoreDoc = async () => {
    if (!coreDoc || !window.confirm('האם אתה בטוח שברצונך למחוק את מסמך הליבה?')) return;

    try {
      // First delete all associated chunks
      const { error: chunksError } = await supabase
        .from('chunks')
        .delete()
        .eq('source_id', coreDoc.id)
        .eq('source_type', 'core_document');

      if (chunksError) {
        console.error('Error deleting chunks:', chunksError);
      }

      // Then delete the core document
      const { error } = await supabase
        .from('core_documents')
        .delete()
        .eq('id', coreDoc.id);

      if (error) throw error;

      setCoreDoc(null);
      setIsEditingCore(false);
      toast({
        title: "מסמך הליבה נמחק בהצלחה",
      });
    } catch (error) {
      console.error('Error deleting core document:', error);
      toast({
        title: "שגיאה במחיקת מסמך הליבה",
        variant: "destructive",
      });
    }
  };

  const handleSyncPadlet = async () => {
    if (!user) {
      toast({
        title: "שגיאה",
        description: "נדרשת התחברות לסנכרון",
        variant: "destructive",
      });
      return;
    }
    
    setSyncingPadlet(true);
    try {
      toast({
        title: "מסנכרן Padlet...",
        description: "מוריד תוכן מהלוח...",
      });

      const { data, error } = await supabase.functions.invoke('sync-padlet', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "סנכרון הושלם",
          description: data.message || `נוספו ${data.results?.created || 0} פריטים חדשים`,
        });
        fetchContentDocuments();
      } else {
        throw new Error(data?.error || 'Failed to sync Padlet');
      }
    } catch (error) {
      console.error('Error syncing Padlet:', error);
      toast({
        title: "שגיאה בסנכרון Padlet",
        description: error instanceof Error ? error.message : "אירעה שגיאה",
        variant: "destructive",
      });
    } finally {
      setSyncingPadlet(false);
    }
  };

  const handlePreviewContentDoc = async () => {
    if (!contentDocFile) return;

    setIsPreviewingContent(true);
    try {
      const formData = new FormData();
      formData.append('file', contentDocFile);

      const { data, error } = await supabase.functions.invoke('preview-document', {
        body: formData
      });

      if (error) throw error;

      setContentPreview(data);
    } catch (error) {
      console.error('Error previewing content document:', error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לטעון תצוגה מקדימה",
        variant: "destructive",
      });
    } finally {
      setIsPreviewingContent(false);
    }
  };

  const handleConfirmContentUpload = async () => {
    if (!contentDocFile || !user) return;

    setUploadingContent(true);
    try {
      // Sanitize filename to remove Hebrew characters and special characters
      const sanitizedFilename = contentDocFile.name
        .replace(/[^\w\s.-]/gi, '') // Remove non-ASCII characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/_{2,}/g, '_'); // Replace multiple underscores with single
      
      const filePath = `${user.id}/${Date.now()}_${sanitizedFilename}`;
      
      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, contentDocFile);

      if (uploadError) throw uploadError;

      // Create document record
      const { data: docData, error: insertError } = await supabase
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
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Trigger processing for embeddings
      if (docData) {
        try {
          await supabase.functions.invoke('trigger-document-processing', {
            body: { documentId: docData.id }
          });
          console.log('Document processing triggered');
          
          toast({
            title: "מעבד עכשיו...",
            description: "המסמך נשלח לעיבוד",
          });
        } catch (procError) {
          console.error('Error triggering processing:', procError);
        }
      }

      const levelLabel = formatDocLevel(contentDocLevel);
      toast({
        title: "הועלה בהצלחה",
        description: `מסמך תוכן ב${levelLabel} נוסף למערכת. מעבד עכשיו...`,
      });

      setIsUploadContentDialogOpen(false);
      setContentDocFile(null);
      setContentPreview(null);
      setContentDocLevel("L1");
      fetchContentDocuments();
    } catch (error) {
      console.error('Error uploading content document:', error);
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "לא ניתן להעלות את מסמך התוכן",
        variant: "destructive",
      });
    } finally {
      setUploadingContent(false);
    }
  };

  const handleApproveContentDoc = async (docId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-documents', {
        body: { action: 'approve', documentId: docId }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to approve document');
      }

      // Update local state immediately
      setContentDocs(prev => prev.map(doc => 
        doc.id === docId ? { ...doc, status: 'מאושר' } : doc
      ));
      
      toast({
        title: "המסמך אושר בהצלחה",
      });
      
      // Also refresh from database to ensure consistency
      fetchContentDocuments();
    } catch (error) {
      console.error('Error approving document:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      toast({
        title: "שגיאה באישור המסמך",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handlePurgePadlet = async () => {
    if (!isMentor) {
      toast({
        title: "אין הרשאה",
        description: "רק מנטור יכול למחוק את כל מסמכי Padlet",
        variant: "destructive",
      });
      return;
    }

    const padletCount = contentDocs.filter(d => d.document_type === 'padlet').length;
    if (padletCount === 0) {
      toast({
        title: "אין מסמכים",
        description: "אין מסמכי Padlet למחיקה",
      });
      return;
    }

    if (!window.confirm(`האם אתה בטוח שברצונך למחוק את כל ${padletCount} מסמכי Padlet?`)) return;

    setPurgingPadlet(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-documents', {
        body: { action: 'purgePadlet' }
      });

      if (error) throw error;
      
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to purge padlet documents');
      }

      toast({
        title: "נמחקו בהצלחה",
        description: data.message || `נמחקו ${data.deletedCount} מסמכי Padlet`,
      });
      
      fetchContentDocuments();
    } catch (error) {
      console.error('Error purging padlet:', error);
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה';
      toast({
        title: "שגיאה במחיקת מסמכי Padlet",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setPurgingPadlet(false);
    }
  };

  const handleManualProcessDocument = async (docId: string) => {
    setProcessingDocId(docId);
    
    try {
      const { data, error } = await supabase.functions.invoke('trigger-document-processing', {
        body: { documentId: docId }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "מעבד עכשיו...",
        description: "המסמך נשלח לעיבוד מחדש",
      });

      // Refresh document list to show updated status
      fetchContentDocuments();
    } catch (error) {
      console.error('Error triggering processing:', error);
      toast({
        title: "שגיאה בהתחלת העיבוד",
        description: error instanceof Error ? error.message : "לא ניתן להתחיל את העיבוד",
        variant: "destructive",
      });
    } finally {
      setProcessingDocId(null);
    }
  };

  // Get unique categories from terms
  const categories = useMemo(() => {
    const uniqueCategories = new Set(
      pakalTerms
        .map(term => term.category)
        .filter((cat): cat is string => cat !== null && cat.trim() !== '')
    );
    return Array.from(uniqueCategories).sort();
  }, [pakalTerms]);

  // Filter terms based on search and category
  const filteredTerms = useMemo(() => {
    return pakalTerms.filter(term => {
      const matchesSearch = searchTerm === "" || 
        term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        term.definition.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = filterCategory === "all" || 
        term.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [pakalTerms, searchTerm, filterCategory]);

  // Export to CSV/Excel
  const handleExportExcel = () => {
    const headers = ["מונח", "הגדרה", "קטגוריה"];
    const rows = filteredTerms.map(term => [
      term.term,
      term.definition,
      term.category || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `מילון_שפת_פקל_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "יוצא בהצלחה",
      description: "המילון יוצא לקובץ Excel",
    });
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Add Hebrew font support (using default font, limited Hebrew support)
    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text("Pakal Dictionary", 105, 15, { align: "center" });
    
    doc.setFontSize(10);
    let yPosition = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    filteredTerms.forEach((term, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
      }

      // Term title
      doc.setFont("helvetica", "bold");
      doc.text(`${index + 1}. ${term.term}`, margin, yPosition);
      yPosition += 7;

      // Category
      if (term.category) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(9);
        doc.text(`Category: ${term.category}`, margin + 5, yPosition);
        yPosition += 6;
      }

      // Definition
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(term.definition, 170);
      doc.text(lines, margin + 5, yPosition);
      yPosition += lines.length * 5 + 10;
    });

    doc.save(`pakal_dictionary_${new Date().toISOString().split('T')[0]}.pdf`);

    toast({
      title: "יוצא בהצלחה",
      description: "המילון יוצא לקובץ PDF",
    });
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="core">מסמך ליבה</TabsTrigger>
            <TabsTrigger value="content">מסמכי תוכן</TabsTrigger>
            <TabsTrigger value="terms">שפת פק״ל</TabsTrigger>
          </TabsList>

          {/* Core Document Tab */}
          <TabsContent value="core" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                    מסמך ליבה – פק״ל במילואים 2025
                  </CardTitle>
                  {coreDoc?.processing_status && (
                    <ProcessingStatusBadge 
                      status={coreDoc.processing_status}
                      error={coreDoc.processing_error}
                      chunksCount={coreDoc.chunks_count}
                    />
                  )}
                  </div>
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
                    {coreDoc && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleDeleteCoreDoc}
                      >
                        <XCircle className="h-4 w-4 ml-1" />
                        מחק
                      </Button>
                    )}
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
                  <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleSyncPadlet}
                    disabled={syncingPadlet}
                    className="border-blue-500 text-blue-600 hover:bg-blue-50"
                  >
                    <ExternalLink className="h-4 w-4 ml-1" />
                    {syncingPadlet ? "מסנכרן..." : "סנכרן Padlet"}
                  </Button>
                  {isMentor && contentDocs.some(d => d.document_type === 'padlet') && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handlePurgePadlet}
                      disabled={purgingPadlet}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      {purgingPadlet ? "מוחק..." : "מחק הכל Padlet"}
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      fetchContentDocuments();
                      toast({
                        title: "רענון",
                        description: "רשימת המסמכים רועננה",
                      });
                    }}
                  >
                    <RefreshCw className="h-4 w-4 ml-1" />
                    רענן
                  </Button>
                  <Dialog
                    open={isUploadContentDialogOpen} 
                    onOpenChange={(open) => {
                      setIsUploadContentDialogOpen(open);
                      if (!open) {
                        setContentDocFile(null);
                        setContentPreview(null);
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 ml-1" />
                        העלה מסמך תוכן
                      </Button>
                    </DialogTrigger>
                    <DialogContent dir="rtl" className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>העלאת מסמך תוכן</DialogTitle>
                        <DialogDescription>
                          העלה מסמך תוכן חדש וקבע את רמת הידע שלו
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        {!contentPreview ? (
                          <>
                            <div>
                              <label className="text-sm font-medium mb-2 block">בחר קובץ</label>
                              <Input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,.md"
                                onChange={(e) => {
                                  setContentDocFile(e.target.files?.[0] || null);
                                  setContentPreview(null);
                                }}
                              />
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-2 block">רמת ידע</label>
                              <Select value={contentDocLevel} onValueChange={setContentDocLevel}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="L1">רמה 1 - מסמכי ליבה פק"לים</SelectItem>
                                  <SelectItem value="L2">רמה 2 - כלים ופעילויות</SelectItem>
                                  <SelectItem value="L3">רמה 3 - מחקר והרחבה</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsUploadContentDialogOpen(false);
                                  setContentDocFile(null);
                                  setContentPreview(null);
                                }}
                              >
                                ביטול
                              </Button>
                              <Button
                                onClick={handleConfirmContentUpload}
                                disabled={!contentDocFile || uploadingContent}
                              >
                                {uploadingContent ? "מעלה..." : "העלה"}
                              </Button>
                            </div>
                          </>
                        ) : (
                          <DocumentPreview
                            preview={contentPreview}
                            isLoading={uploadingContent}
                            onConfirm={handleConfirmContentUpload}
                            onCancel={() => {
                              setContentPreview(null);
                              setContentDocFile(null);
                            }}
                          />
                        )}
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 ml-1" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 ml-1" />
                    PDF
                  </Button>
                  </div>
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
                          {doc.document_type === 'padlet' ? (
                            <ExternalLink className="h-8 w-8 text-orange-500" />
                          ) : (
                            <FileText className="h-8 w-8 text-primary" />
                          )}
                          <div>
                            <h3 className="font-medium">{doc.title}</h3>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {doc.document_type === 'padlet' ? (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300">
                                  Padlet
                                </Badge>
                              ) : (
                                <Badge variant={doc.document_level === 'L1' ? 'default' : doc.document_level === 'L2' ? 'secondary' : 'outline'}>
                                  {formatDocLevel(doc.document_level)}
                                </Badge>
                              )}
                              <Badge variant={doc.status === 'מאושר' ? 'default' : 'secondary'}>
                              {doc.status}
                            </Badge>
                            {doc.processing_status && (
                              <ProcessingStatusBadge 
                                status={doc.processing_status}
                                error={doc.processing_error}
                                chunksCount={doc.chunks_count}
                              />
                            )}
                              <span className="text-xs text-muted-foreground">
                                {(doc.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(doc.created_at).toLocaleDateString('he-IL')}
                          </span>
                          {doc.status === 'ממתין לאישור' && isMentor ? (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApproveContentDoc(doc.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 ml-1" />
                              אשר
                            </Button>
                          ) : doc.status === 'ממתין לאישור' && !isMentor ? (
                            <Badge variant="secondary" className="text-orange-600">
                              ממתין לאישור מנטור
                            </Badge>
                          ) : doc.status === 'מאושר' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 ml-1" />
                              מאושר
                            </Badge>
                          ) : null}
                          {doc.processing_status === 'failed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleManualProcessDocument(doc.id)}
                              disabled={processingDocId === doc.id}
                              className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                            >
                              <PlayCircle className="h-4 w-4 ml-1" />
                              {processingDocId === doc.id ? 'מעבד...' : 'עבד מחדש'}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingContentDoc(doc);
                              setIsEditContentDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteContentDoc(doc.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pakal Terms Tab */}
          <TabsContent value="terms" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>מילון שפת פק״ל</CardTitle>
                  <div className="flex gap-2">
                    <Dialog open={isAddTermDialogOpen} onOpenChange={setIsAddTermDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 ml-1" />
                          הוסף מונח
                        </Button>
                      </DialogTrigger>
                    <DialogContent dir="rtl">
                      <DialogHeader>
                        <DialogTitle>הוספת מונח חדש</DialogTitle>
                        <DialogDescription>
                          הוסף מונח חדש למילון שפת הפק״ל
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">מונח</label>
                          <Input
                            value={newTerm.term}
                            onChange={(e) => setNewTerm({ ...newTerm, term: e.target.value })}
                            placeholder="לדוגמה: פק״ל"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">הגדרה</label>
                          <Textarea
                            value={newTerm.definition}
                            onChange={(e) => setNewTerm({ ...newTerm, definition: e.target.value })}
                            placeholder="הגדרת המונח"
                            className="min-h-[100px]"
                            dir="rtl"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">קטגוריה (אופציונלי)</label>
                          <Input
                            value={newTerm.category}
                            onChange={(e) => setNewTerm({ ...newTerm, category: e.target.value })}
                            placeholder="לדוגמה: ארגון, אימונים"
                            dir="rtl"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddTermDialogOpen(false)}
                          >
                            ביטול
                          </Button>
                          <Button
                            onClick={handleAddTerm}
                            disabled={savingTerm}
                          >
                            {savingTerm ? "שומר..." : "הוסף"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={handleExportExcel}>
                    <Download className="h-4 w-4 ml-1" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportPDF}>
                    <Download className="h-4 w-4 ml-1" />
                    PDF
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search and Filter Controls */}
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="חיפוש מונח או הגדרה..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                      dir="rtl"
                    />
                  </div>
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-[200px]">
                      <Filter className="h-4 w-4 ml-2" />
                      <SelectValue placeholder="סינון לפי קטגוריה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל הקטגוריות</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {loadingTerms ? (
                  <div className="text-center py-8 text-muted-foreground">טוען...</div>
                ) : pakalTerms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>אין מונחים במילון. לחץ על "הוסף מונח" כדי להתחיל.</p>
                  </div>
                ) : filteredTerms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Search className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p>לא נמצאו מונחים תואמים לחיפוש.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTerms.map((term) => (
                      <div
                        key={term.id}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg">{term.term}</h3>
                            {term.category && (
                              <Badge variant="outline">{term.category}</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {term.definition}
                          </p>
                        </div>
                        <div className="flex gap-1 mr-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingTerm(term);
                              setIsEditTermDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTerm(term.id)}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Content Document Dialog */}
      <Dialog open={isEditContentDialogOpen} onOpenChange={setIsEditContentDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת מסמך תוכן</DialogTitle>
            <DialogDescription>
              ערוך את פרטי מסמך התוכן
            </DialogDescription>
          </DialogHeader>
          {editingContentDoc && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">כותרת</label>
                <Input
                  value={editingContentDoc.title}
                  onChange={(e) => setEditingContentDoc({ ...editingContentDoc, title: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">רמת ידע</label>
                <Select 
                  value={editingContentDoc.document_level || ""} 
                  onValueChange={(value) => setEditingContentDoc({ ...editingContentDoc, document_level: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L1">רמה 1 - מסמכי ליבה פק"לים</SelectItem>
                    <SelectItem value="L2">רמה 2 - כלים ופעילויות</SelectItem>
                    <SelectItem value="L3">רמה 3 - מחקר והרחבה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">סטטוס</label>
                <Select 
                  value={editingContentDoc.status} 
                  onValueChange={(value) => setEditingContentDoc({ ...editingContentDoc, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ממתין לאישור">ממתין לאישור</SelectItem>
                    <SelectItem value="מאושר">מאושר</SelectItem>
                    <SelectItem value="נדחה">נדחה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditContentDialogOpen(false);
                    setEditingContentDoc(null);
                  }}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleEditContentDoc}
                  disabled={savingTerm}
                >
                  {savingTerm ? "שומר..." : "שמור"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Term Dialog */}
      <Dialog open={isEditTermDialogOpen} onOpenChange={setIsEditTermDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>עריכת מונח</DialogTitle>
            <DialogDescription>
              ערוך את המונח במילון שפת הפק״ל
            </DialogDescription>
          </DialogHeader>
          {editingTerm && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">מונח</label>
                <Input
                  value={editingTerm.term}
                  onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">הגדרה</label>
                <Textarea
                  value={editingTerm.definition}
                  onChange={(e) => setEditingTerm({ ...editingTerm, definition: e.target.value })}
                  className="min-h-[100px]"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">קטגוריה (אופציונלי)</label>
                <Input
                  value={editingTerm.category || ""}
                  onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value })}
                  dir="rtl"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsEditTermDialogOpen(false);
                    setEditingTerm(null);
                  }}
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleEditTerm}
                  disabled={savingTerm}
                >
                  {savingTerm ? "שומר..." : "שמור"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {isSystemInsightsOpen && (
        <SystemInsightsWindow
          onClose={() => setIsSystemInsightsOpen(false)}
          analytics={analytics}
        />
      )}
    </div>
  );
}
