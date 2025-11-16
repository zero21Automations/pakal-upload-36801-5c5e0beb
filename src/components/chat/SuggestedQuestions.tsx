import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, SuggestedQuestion } from '@/types/roles';
import { Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  role: AppRole | null;
  onQuestionClick: (question: string) => void;
}

export const SuggestedQuestions = ({ role, onQuestionClick }: SuggestedQuestionsProps) => {
  const [questions, setQuestions] = useState<SuggestedQuestion[]>([]);

  useEffect(() => {
    if (!role) return;

    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('suggested_questions')
        .select('*')
        .eq('role_type', role)
        .order('priority', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching suggested questions:', error);
        return;
      }

      setQuestions(data || []);
    };

    fetchQuestions();
  }, [role]);

  if (!questions.length) return null;

  return (
    <div className="border-t pt-4 space-y-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4" />
        <span>שאלות מומלצות:</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {questions.map((q) => (
          <Badge
            key={q.id}
            variant="outline"
            className="cursor-pointer hover:bg-accent transition-colors text-right py-2 px-3"
            onClick={() => onQuestionClick(q.question_text)}
          >
            {q.question_text}
          </Badge>
        ))}
      </div>
    </div>
  );
};
