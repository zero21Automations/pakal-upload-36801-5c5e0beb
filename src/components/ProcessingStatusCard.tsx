import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { AlertCircle, RefreshCw, CheckCircle, XCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProcessingStatusCardProps {
  totalDocuments: number;
  processedDocuments: number;
  onRefresh?: () => void;
}

export const ProcessingStatusCard = ({ totalDocuments, processedDocuments, onRefresh }: ProcessingStatusCardProps) => {
  const [isReprocessing, setIsReprocessing] = useState(false);

  const handleReprocessAllDocuments = async () => {
    try {
      setIsReprocessing(true);
      toast.info("מתחיל עיבוד מחדש של מסמכים...");

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("משתמש לא מחובר");
        return;
      }

      const { data, error } = await supabase.functions.invoke('reprocess-documents', {
        body: { org_id: user.id }
      });

      if (error) {
        throw error;
      }

      if (data.success) {
        toast.success(data.message);
        onRefresh?.();
      } else {
        throw new Error(data.error || "שגיאה לא ידועה בעיבוד");
      }
    } catch (error: any) {
      console.error('Error reprocessing documents:', error);
      toast.error(`שגיאה בעיבוד מחדש: ${error.message}`);
    } finally {
      setIsReprocessing(false);
    }
  };

  const processingPercentage = totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 0;
  const pendingDocuments = totalDocuments - processedDocuments;

  const getStatusIcon = () => {
    if (processingPercentage === 100) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (processingPercentage > 0) return <Clock className="h-5 w-5 text-yellow-500" />;
    return <AlertCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusText = () => {
    if (processingPercentage === 100) return "כל המסמכים עובדו בהצלחה";
    if (processingPercentage > 0) return "עיבוד חלקי";
    return "לא עובדו מסמכים";
  };

  const getStatusColor = () => {
    if (processingPercentage === 100) return "bg-green-500";
    if (processingPercentage > 0) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          סטטוס עיבוד AI
        </CardTitle>
        <CardDescription>
          מעקב אחר עיבוד המסמכים באמצעות בינה מלאכותית
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>התקדמות עיבוד</span>
            <span>{Math.round(processingPercentage)}%</span>
          </div>
          <Progress value={processingPercentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{totalDocuments}</div>
            <div className="text-sm text-muted-foreground">סה"כ מסמכים</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{processedDocuments}</div>
            <div className="text-sm text-muted-foreground">עובדו</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{pendingDocuments}</div>
            <div className="text-sm text-muted-foreground">ממתינים</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={processingPercentage === 100 ? "default" : "secondary"} className={processingPercentage === 100 ? "bg-green-100 text-green-800" : ""}>
            {getStatusText()}
          </Badge>
          <Button 
            onClick={handleReprocessAllDocuments}
            disabled={isReprocessing || totalDocuments === 0}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 ml-2 ${isReprocessing ? 'animate-spin' : ''}`} />
            {isReprocessing ? 'מעבד...' : 'עבד מחדש הכל'}
          </Button>
        </div>

        {processingPercentage < 100 && (
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>הערה:</strong> מסמכים שלא עובדו לא יהיו זמינים עבור החיפוש והתובנות של ה-AI. 
            לחץ על "עבד מחדש הכל" כדי להפעיל מחדש את עיבוד ה-AI.
          </div>
        )}
      </CardContent>
    </Card>
  );
};