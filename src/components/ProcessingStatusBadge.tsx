import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, FileText, Brain, Database } from "lucide-react";

interface ProcessingStatusBadgeProps {
  status: string | null | undefined;
  error?: string | null;
  chunksCount?: number | null;
}

export const ProcessingStatusBadge = ({ status, error, chunksCount }: ProcessingStatusBadgeProps) => {
  if (!status || status === 'pending') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        ממתין
      </Badge>
    );
  }

  if (status === 'extracting') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        <FileText className="h-3 w-3 animate-pulse" />
        מחלץ טקסט
      </Badge>
    );
  }

  if (status === 'classifying') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
        <Brain className="h-3 w-3 animate-pulse" />
        מסווג
      </Badge>
    );
  }

  if (status === 'embedding') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
        <Database className="h-3 w-3 animate-pulse" />
        יוצר embeddings
      </Badge>
    );
  }

  if (status === 'processing') {
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        <Loader2 className="h-3 w-3 animate-spin" />
        מעבד
      </Badge>
    );
  }

  if (status === 'completed') {
    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
        <CheckCircle className="h-3 w-3" />
        {chunksCount ? `הושלם (${chunksCount} קטעים)` : 'הושלם'}
      </Badge>
    );
  }

  if (status === 'failed') {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <XCircle className="h-3 w-3" />
        נכשל
      </Badge>
    );
  }

  return <Badge variant="outline">{status}</Badge>;
};

