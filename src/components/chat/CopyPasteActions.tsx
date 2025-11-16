import { Button } from '@/components/ui/button';
import { Copy, Mail, MessageCircle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CopyPasteActionsProps {
  content: string;
}

export const CopyPasteActions = ({ content }: CopyPasteActionsProps) => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'הועתק ללוח',
      description: `${label} הועתק בהצלחה`
    });
  };

  const formatForWhatsApp = (text: string) => {
    return text.replace(/\*\*(.*?)\*\*/g, '*$1*');
  };

  const formatForEmail = (text: string) => {
    return `שלום,\n\n${text}\n\nבברכה,`;
  };

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(formatForWhatsApp(content), 'הודעת וואטסאפ')}
      >
        <MessageCircle className="h-4 w-4 ml-2" />
        שלח לי כוואטסאפ
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(formatForEmail(content), 'אימייל')}
      >
        <Mail className="h-4 w-4 ml-2" />
        נסח כאימייל
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => copyToClipboard(content, 'טקסט מלא')}
      >
        <FileText className="h-4 w-4 ml-2" />
        הצג כטקסט מלא
      </Button>
    </div>
  );
};
