import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Loader2,
  FileType,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: {
    id: string;
    title: string;
    filename: string;
    file_path: string;
    file_type: string | null;
    document_type: string;
    file_size: number;
  } | null;
}

export function DocumentViewerDialog({ 
  open, 
  onOpenChange, 
  document 
}: DocumentViewerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      // Clean up URL when dialog closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setError(null);
    }
    
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [open, document?.id]);

  const loadPreview = async () => {
    if (!document) return;

    // For Padlet documents, open in new tab
    if (document.document_type === 'padlet') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
    } catch (err) {
      console.error('Error loading document preview:', err);
      setError('לא ניתן לטעון את המסמך לתצוגה מקדימה');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      const { data, error: downloadError } = await supabase.storage
        .from('documents')
        .download(document.file_path);

      if (downloadError) throw downloadError;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document.filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "המסמך הורד בהצלחה",
      });
    } catch (err) {
      console.error('Error downloading document:', err);
      toast({
        title: "שגיאה בהורדת המסמך",
        variant: "destructive",
      });
    }
  };

  const handleOpenPadlet = () => {
    if (document?.document_type === 'padlet' && document.file_path) {
      window.open(document.file_path, '_blank');
    }
  };

  const isPdf = document?.file_type?.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    document?.file_type?.toLowerCase() || ''
  );

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl h-[85vh] flex flex-col" 
        dir="rtl"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {document.document_type === 'padlet' ? (
              <ExternalLink className="h-5 w-5 text-orange-500" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            {document.title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">
              {document.file_type?.toUpperCase() || 'מסמך'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {(document.file_size / 1024).toFixed(1)} KB
            </span>
            {document.document_type !== 'padlet' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                className="mr-auto"
              >
                <Download className="h-4 w-4 ml-1" />
                הורד
              </Button>
            )}
            {document.document_type === 'padlet' && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleOpenPadlet}
                className="mr-auto"
              >
                <ExternalLink className="h-4 w-4 ml-1" />
                פתח ב-Padlet
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-lg bg-muted/30">
          {document.document_type === 'padlet' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <ExternalLink className="h-16 w-16 text-orange-500" />
              <div>
                <h3 className="text-lg font-medium mb-2">תוכן Padlet</h3>
                <p className="text-muted-foreground mb-4">
                  תוכן זה מקורו ב-Padlet ולא ניתן להציגו כאן ישירות
                </p>
                <Button onClick={handleOpenPadlet}>
                  <ExternalLink className="h-4 w-4 ml-2" />
                  פתח ב-Padlet
                </Button>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="mr-2">טוען מסמך...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={handleDownload}>
                  <Download className="h-4 w-4 ml-2" />
                  הורד את המסמך במקום
                </Button>
              </div>
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title={document.title}
            />
          ) : isImage && previewUrl ? (
            <div className="flex items-center justify-center h-full p-4">
              <img 
                src={previewUrl} 
                alt={document.title}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : previewUrl ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <FileType className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-lg font-medium mb-2">
                  לא ניתן להציג סוג קובץ זה בדפדפן
                </h3>
                <p className="text-muted-foreground mb-4">
                  קובץ מסוג {document.file_type?.toUpperCase()} - ניתן להוריד ולצפות בתוכנה מתאימה
                </p>
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 ml-2" />
                  הורד את המסמך
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
