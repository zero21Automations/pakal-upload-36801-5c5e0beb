import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Loader2,
  AlertCircle,
  FileType,
  Hash,
  Layers
} from "lucide-react";

interface DocumentPreviewProps {
  preview: {
    fileName: string;
    fileType: string;
    fileSize: number;
    contentPreview: string;
    stats: {
      totalCharacters: number;
      totalWords: number;
      totalChunks: number;
      avgChunkLength: number;
      estimatedEmbeddingCost: number;
    };
    sampleChunks: Array<{
      sequence: number;
      content: string;
      length: number;
    }>;
    isContentTruncated: boolean;
  };
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DocumentPreview = ({ 
  preview, 
  isLoading = false,
  onConfirm, 
  onCancel 
}: DocumentPreviewProps) => {
  return (
    <div className="space-y-4" dir="rtl">
      {/* File Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            מידע על הקובץ
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">שם הקובץ</div>
              <div className="font-medium">{preview.fileName}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">סוג</div>
              <Badge variant="outline">{preview.fileType.toUpperCase()}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">גודל</div>
              <div className="font-medium">{(preview.fileSize / 1024).toFixed(1)} KB</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Hash className="h-5 w-5" />
            סטטיסטיקות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{preview.stats.totalCharacters.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">תווים</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{preview.stats.totalWords.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">מילים</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{preview.stats.totalChunks}</div>
              <div className="text-xs text-muted-foreground">קטעים</div>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{Math.round(preview.stats.avgChunkLength)}</div>
              <div className="text-xs text-muted-foreground">ממוצע תווים/קטע</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileType className="h-5 w-5" />
            תצוגה מקדימה של התוכן
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px] w-full rounded-md border p-4" dir="rtl">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">
              {preview.contentPreview}
            </p>
            {preview.isContentTruncated && (
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <AlertCircle className="h-4 w-4" />
                התוכן המלא ארוך יותר...
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sample Chunks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Layers className="h-5 w-5" />
            דוגמאות קטעים ({preview.sampleChunks.length} מתוך {preview.stats.totalChunks})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {preview.sampleChunks.map((chunk) => (
            <div key={chunk.sequence} className="border rounded-lg p-3 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="text-xs">
                  קטע {chunk.sequence + 1}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {chunk.length} תווים
                </span>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-3">
                {chunk.content}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Separator />

      {/* Info Box */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
        <div className="flex-1 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
            מה יקרה בהמשך?
          </p>
          <ul className="text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
            <li>המסמך יחולק ל-{preview.stats.totalChunks} קטעים</li>
            <li>כל קטע יומר ל-embedding וקטורי</li>
            <li>הקטעים יישמרו במאגר הידע לחיפוש סמנטי</li>
            <li>זמן עיבוד משוער: {Math.ceil(preview.stats.totalChunks / 5)} שניות</li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <XCircle className="h-4 w-4 ml-2" />
          ביטול
        </Button>
        <Button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
              מעלה...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 ml-2" />
              אשר והעלה
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
