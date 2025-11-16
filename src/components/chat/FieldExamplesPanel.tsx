import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CONTENT_CATEGORY_LABELS, TOPIC_TAG_OPTIONS } from "@/types/content";

interface FieldExample {
  id: string;
  content: string;
  methodology_name: string | null;
  topic_tags: string[] | null;
  content_category: string | null;
  difficulty_level: string | null;
  time_required: number | null;
  source_title?: string;
}

export function FieldExamplesPanel() {
  const [examples, setExamples] = useState<FieldExample[]>([]);
  const [filteredExamples, setFilteredExamples] = useState<FieldExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [tagFilter, setTagFilter] = useState<string>("all");

  useEffect(() => {
    fetchFieldExamples();
  }, []);

  useEffect(() => {
    filterExamples();
  }, [examples, searchTerm, categoryFilter, tagFilter]);

  const fetchFieldExamples = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chunks')
        .select('id, content, methodology_name, topic_tags, content_category, difficulty_level, time_required')
        .eq('content_category', 'field_examples')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setExamples(data || []);
    } catch (error) {
      console.error('Error fetching field examples:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterExamples = () => {
    let filtered = examples;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(ex => 
        ex.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ex.methodology_name && ex.methodology_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(ex => ex.content_category === categoryFilter);
    }

    // Tag filter
    if (tagFilter !== "all") {
      filtered = filtered.filter(ex => 
        ex.topic_tags && ex.topic_tags.includes(tagFilter)
      );
    }

    setFilteredExamples(filtered);
  };

  const getDifficultyBadge = (level: string | null) => {
    if (!level) return null;
    const colors = {
      beginner: "bg-green-500/10 text-green-600 dark:text-green-400",
      intermediate: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      advanced: "bg-red-500/10 text-red-600 dark:text-red-400"
    };
    const labels = { beginner: "מתחיל", intermediate: "בינוני", advanced: "מתקדם" };
    return (
      <Badge className={colors[level as keyof typeof colors]}>
        {labels[level as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            דוגמאות מהשטח
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש דוגמאות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="קטגוריה" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הקטגוריות</SelectItem>
                {Object.entries(CONTENT_CATEGORY_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="תגית נושא" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל התגיות</SelectItem>
                {TOPIC_TAG_OPTIONS.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Examples List */}
          <ScrollArea className="h-[600px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">טוען דוגמאות...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                לא נמצאו דוגמאות מתאימות
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExamples.map((example) => (
                  <Card key={example.id} className="hover:bg-accent/50 transition-colors">
                    <CardContent className="p-4 space-y-2">
                      {example.methodology_name && (
                        <div className="font-semibold text-sm text-primary">
                          {example.methodology_name}
                        </div>
                      )}
                      <p className="text-sm leading-relaxed">
                        {example.content.length > 300 
                          ? example.content.substring(0, 300) + '...' 
                          : example.content}
                      </p>
                      <div className="flex flex-wrap gap-2 pt-2">
                        {example.topic_tags?.map((tag) => {
                          const tagOption = TOPIC_TAG_OPTIONS.find(t => t.value === tag);
                          return tagOption ? (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tagOption.label}
                            </Badge>
                          ) : null;
                        })}
                        {getDifficultyBadge(example.difficulty_level)}
                        {example.time_required && (
                          <Badge variant="outline" className="text-xs">
                            {example.time_required} דקות
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
