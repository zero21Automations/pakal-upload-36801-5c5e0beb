import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText } from "lucide-react";

interface Citation {
  source_id: string;
  chunk_id: string;
  title: string;
  level: number;
  confidence: number;
  excerpt: string;
}

interface CitationCardProps {
  citation: Citation;
  onViewSource?: (sourceId: string) => void;
}

const CitationCard = ({ citation, onViewSource }: CitationCardProps) => {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1: return "bg-green-100 text-green-800 border-green-200";
      case 2: return "bg-blue-100 text-blue-800 border-blue-200";
      case 3: return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 1: return "L1 - פק״ל ליבה";
      case 2: return "L2 - כלים והדרכות";
      case 3: return "L3 - מחקר והקשר";
      default: return `L${level}`;
    }
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "רלוונטיות גבוהה";
    if (confidence >= 0.6) return "רלוונטיות בינונית";
    return "רלוונטיות נמוכה";
  };

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow" dir="rtl">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h4 className="font-medium text-sm line-clamp-1">{citation.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={`text-xs font-medium ${getLevelColor(citation.level)}`}
            >
              {getLevelText(citation.level)}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
          {citation.excerpt}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {getConfidenceText(citation.confidence)}
            </span>
            <span className="text-xs text-muted-foreground">
              ({Math.round(citation.confidence * 100)}%)
            </span>
          </div>
          
          {onViewSource && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewSource(citation.source_id)}
              className="h-8 px-2 text-xs"
            >
              <ExternalLink className="h-3 w-3 ml-1" />
              צפה במקור
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CitationCard;