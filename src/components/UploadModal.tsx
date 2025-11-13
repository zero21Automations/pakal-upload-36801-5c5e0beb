import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // If no title provided, use filename
      if (!title) {
        setTitle(selectedFile.name.split('.')[0]);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ להעלאה",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get current user (you'll need to implement auth)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "שגיאה",
          description: "עליך להתחבר כדי להעלות קבצים",
          variant: "destructive",
        });
        return;
      }

      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      if (uploadError) {
        throw uploadError;
      }

      // Save document metadata to database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title: title.trim() || file.name.split('.')[0], // Use filename if no title
          filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          file_type: fileExt,
          content_type: file.type,
          status: 'ממתין לאישור'
        })
        .select()
        .single();

      if (dbError) {
        throw dbError;
      }

      // Trigger AI processing
      try {
        const { error: processError } = await supabase.functions.invoke('process-document', {
          body: { documentId: documentData.id }
        });
        
        if (processError) {
          console.error('Processing error:', processError);
        }
      } catch (processError) {
        console.error('Failed to trigger processing:', processError);
      }

      toast({
        title: "הועלה בהצלחה!",
        description: "המסמך מעובד כעת באמצעות בינה מלאכותית ויסווג אוטומטית.",
      });

      // Reset form and close modal
      setFile(null);
      setTitle("");
      setDescription("");
      onClose();

    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "שגיאה בהעלאה",
        description: "אירעה שגיאה בעת העלאת הקובץ. אנא נסה שוב.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setFile(null);
    setTitle("");
    setDescription("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadIcon className="h-5 w-5" />
            העלאת מסמך חדש
          </DialogTitle>
          <DialogDescription>
            העלה מסמכים למערכת הידע הארגונית. המערכת תנתח את התוכן ותקבע את רמת הסיווג באופן אוטומטי.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Upload Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>הנחיות העלאה:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• גודל קובץ מקסימלי: 50MB</li>
                <li>• פורמטים נתמכים: PDF, DOC, DOCX, TXT, JPG, PNG</li>
                <li>• הכותרת היא שדה אופציונלי - אם לא תמולא תשתמש המערכת בשם הקובץ</li>
                <li>• רמת הסיווג תקבע אוטומטית על ידי בינה מלאכותית</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="modal-file-upload">קובץ</Label>
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="modal-file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 hover:bg-accent/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "לחץ לבחירת קובץ או גרור קובץ לכאן"}
                  </p>
                  {file && (
                    <p className="text-xs text-muted-foreground mt-1">
                      גודל: {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  )}
                </div>
                <input
                  id="modal-file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
              </label>
            </div>
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="modal-title">כותרת (אופציונלי)</Label>
            <Input
              id="modal-title"
              placeholder="כותרת המסמך - אם לא יוזן תשמש כותרת הקובץ"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="modal-description">תיאור (אופציונלי)</Label>
            <Textarea
              id="modal-description"
              placeholder="תיאור קצר של המסמך..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end" dir="ltr">
            <Button variant="outline" onClick={handleClose}>
              ביטול
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  מעלה...
                </>
              ) : (
                <>
                  <UploadIcon className="h-4 w-4" />
                  העלה מסמך
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}