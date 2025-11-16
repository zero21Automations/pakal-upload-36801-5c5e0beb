import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Clock, 
  Target, 
  Tag, 
  TrendingUp,
  BookOpen,
  ExternalLink 
} from 'lucide-react';
import { 
  CONTENT_CATEGORY_LABELS, 
  DIFFICULTY_LABELS,
  ContentCategory,
  DifficultyLevel 
} from '@/types/content';
import { ROLE_LABELS, AppRole } from '@/types/roles';

interface EnhancedCitationCardProps {
  citation: {
    source_id: string;
    chunk_id: string;
    title: string;
    level: number;
    confidence: number;
    excerpt: string;
    metadata?: {
      content_category?: ContentCategory;
      target_roles?: AppRole[];
      time_required?: number;
      topic_tags?: string[];
      methodology_name?: string;
      is_practical?: boolean;
      difficulty_level?: DifficultyLevel;
    };
  };
  onViewSource: (sourceId: string) => void;
}

export const EnhancedCitationCard = ({ citation, onViewSource }: EnhancedCitationCardProps) => {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-purple-500/10 text-purple-700 dark:text-purple-300';
      case 1: return 'bg-blue-500/10 text-blue-700 dark:text-blue-300';
      case 2: return 'bg-green-500/10 text-green-700 dark:text-green-300';
      case 3: return 'bg-amber-500/10 text-amber-700 dark:text-amber-300';
      default: return 'bg-gray-500/10 text-gray-700 dark:text-gray-300';
    }
  };

  const getLevelLabel = (level: number) => {
    switch (level) {
      case 0: return 'מסמך ליבה';
      case 1: return 'רמה 1';
      case 2: return 'רמה 2';
      case 3: return 'רמה 3';
      default: return `רמה ${level}`;
    }
  };

  const confidencePercentage = Math.round(citation.confidence * 100);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <FileText className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2">{citation.title}</h4>
            </div>
          </div>
          <Badge variant="secondary" className={`${getLevelColor(citation.level)} text-xs flex-shrink-0`}>
            {getLevelLabel(citation.level)}
          </Badge>
        </div>

        {/* Excerpt */}
        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
          {citation.excerpt}
        </p>

        {/* Enhanced Metadata */}
        {citation.metadata && (
          <div className="space-y-2 pt-2 border-t">
            {/* Category & Practical Badge */}
            <div className="flex flex-wrap gap-2">
              {citation.metadata.content_category && (
                <Badge variant="outline" className="text-xs gap-1">
                  <BookOpen className="h-3 w-3" />
                  {CONTENT_CATEGORY_LABELS[citation.metadata.content_category]}
                </Badge>
              )}
              {citation.metadata.is_practical && (
                <Badge variant="outline" className="text-xs gap-1 bg-green-500/10">
                  <Target className="h-3 w-3" />
                  מעשי
                </Badge>
              )}
            </div>

            {/* Time Required & Difficulty */}
            <div className="flex flex-wrap gap-2">
              {citation.metadata.time_required && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Clock className="h-3 w-3" />
                  {citation.metadata.time_required} דק׳
                </Badge>
              )}
              {citation.metadata.difficulty_level && (
                <Badge variant="outline" className="text-xs gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {DIFFICULTY_LABELS[citation.metadata.difficulty_level]}
                </Badge>
              )}
            </div>

            {/* Methodology Name */}
            {citation.metadata.methodology_name && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">מתודה:</span> {citation.metadata.methodology_name}
              </div>
            )}

            {/* Topic Tags */}
            {citation.metadata.topic_tags && citation.metadata.topic_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {citation.metadata.topic_tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs gap-1">
                    <Tag className="h-3 w-3" />
                    {tag}
                  </Badge>
                ))}
                {citation.metadata.topic_tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{citation.metadata.topic_tags.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Target Roles */}
            {citation.metadata.target_roles && citation.metadata.target_roles.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">רלוונטי ל:</span>{' '}
                {citation.metadata.target_roles.slice(0, 2).map(role => ROLE_LABELS[role]).join(', ')}
                {citation.metadata.target_roles.length > 2 && ` +${citation.metadata.target_roles.length - 2}`}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              <span>{confidencePercentage}% רלוונטיות</span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onViewSource(citation.source_id)}
            className="h-7 text-xs gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            פתח מסמך
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
