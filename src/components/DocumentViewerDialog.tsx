import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Loader2,
  FileType,
  AlertCircle,
  Search,
  X,
  Table as TableIcon
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

// Highlight matching text
function HighlightedText({ text, searchQuery }: { text: string; searchQuery: string }) {
  if (!searchQuery.trim()) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  
  return (
    <>
      {parts.map((part, index) => 
        part.toLowerCase() === searchQuery.toLowerCase() ? (
          <mark key={index} className="bg-yellow-300 dark:bg-yellow-600 rounded px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function DocumentViewerDialog({ 
  open, 
  onOpenChange, 
  document 
}: DocumentViewerDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isDocx = document?.file_type?.toLowerCase() === 'docx' || 
                 document?.file_type?.toLowerCase() === 'doc';
  const isExcel = document?.file_type?.toLowerCase() === 'xlsx' || 
                  document?.file_type?.toLowerCase() === 'xls';

  useEffect(() => {
    if (open && document) {
      loadPreview();
    } else {
      // Clean up when dialog closes
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
      setTextContent(null);
      setExcelData(null);
      setSheetNames([]);
      setError(null);
      setSearchQuery("");
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
      // For Word/Excel documents, use the preview-document function
      if (isDocx || isExcel) {
        const { data: responseData, error: fnError } = await supabase.functions.invoke('preview-document', {
          body: {
            bucket: 'documents',
            path: document.file_path,
            filename: document.filename
          }
        });

        if (fnError) throw fnError;
        if (responseData?.error) throw new Error(responseData.error);

        if (isExcel && responseData.excelData) {
          setExcelData(responseData.excelData);
          setSheetNames(responseData.sheetNames || []);
        }
        setTextContent(responseData.fullContent || responseData.contentPreview || 'לא נמצא תוכן');
      } else {
        // For other files, download and create blob URL
        const { data, error: downloadError } = await supabase.storage
          .from('documents')
          .download(document.file_path);

        if (downloadError) throw downloadError;

        const url = URL.createObjectURL(data);
        setPreviewUrl(url);
      }
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

  // Filter Excel data based on search
  const filteredExcelData = useMemo(() => {
    if (!excelData || !searchQuery.trim()) return excelData;
    
    return excelData.filter((row, index) => {
      // Always keep header row
      if (index === 0) return true;
      return row.some(cell => 
        String(cell).toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [excelData, searchQuery]);

  // Count matches for display
  const matchCount = useMemo(() => {
    if (!searchQuery.trim()) return 0;
    
    if (excelData) {
      let count = 0;
      excelData.forEach((row, index) => {
        if (index === 0) return; // Skip header
        row.forEach(cell => {
          const cellStr = String(cell).toLowerCase();
          const query = searchQuery.toLowerCase();
          let pos = 0;
          while ((pos = cellStr.indexOf(query, pos)) !== -1) {
            count++;
            pos += query.length;
          }
        });
      });
      return count;
    }
    
    if (textContent) {
      const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      return (textContent.match(regex) || []).length;
    }
    
    return 0;
  }, [searchQuery, textContent, excelData]);

  const isPdf = document?.file_type?.toLowerCase() === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(
    document?.file_type?.toLowerCase() || ''
  );
  const isWord = isDocx;
  const showSearch = isWord || isExcel;

  if (!document) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-5xl h-[85vh] flex flex-col" 
        dir="rtl"
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {document.document_type === 'padlet' ? (
              <ExternalLink className="h-5 w-5 text-primary" />
            ) : isExcel ? (
              <TableIcon className="h-5 w-5 text-primary" />
            ) : (
              <FileText className="h-5 w-5 text-primary" />
            )}
            {document.title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline">
              {document.file_type?.toUpperCase() || 'מסמך'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {(document.file_size / 1024).toFixed(1)} KB
            </span>
            {sheetNames.length > 0 && (
              <Badge variant="secondary">
                {sheetNames.length} גיליונות
              </Badge>
            )}
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
          
          {/* Search bar for text/excel content */}
          {showSearch && !loading && !error && (
            <div className="flex items-center gap-2 mt-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חיפוש במסמך..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 pl-9"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <span className="text-sm text-muted-foreground">
                  {matchCount} תוצאות
                </span>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden border rounded-lg bg-muted/30">
          {document.document_type === 'padlet' ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 p-8 text-center">
              <ExternalLink className="h-16 w-16 text-primary" />
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
          ) : isExcel && filteredExcelData ? (
            <ScrollArea className="h-full">
              <div className="p-4">
                <Table>
                  <TableHeader>
                    {filteredExcelData[0] && (
                      <TableRow>
                        {filteredExcelData[0].map((cell: any, index: number) => (
                          <TableHead key={index} className="text-right font-bold bg-muted">
                            <HighlightedText text={String(cell || '')} searchQuery={searchQuery} />
                          </TableHead>
                        ))}
                      </TableRow>
                    )}
                  </TableHeader>
                  <TableBody>
                    {filteredExcelData.slice(1).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {row.map((cell: any, cellIndex: number) => (
                          <TableCell key={cellIndex} className="text-right">
                            <HighlightedText text={String(cell || '')} searchQuery={searchQuery} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {filteredExcelData.length === 1 && searchQuery && (
                  <div className="text-center text-muted-foreground py-8">
                    לא נמצאו תוצאות עבור "{searchQuery}"
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : isWord && textContent ? (
            <ScrollArea className="h-full">
              <div className="p-6 whitespace-pre-wrap text-sm leading-relaxed" dir="auto">
                <HighlightedText text={textContent} searchQuery={searchQuery} />
              </div>
            </ScrollArea>
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
