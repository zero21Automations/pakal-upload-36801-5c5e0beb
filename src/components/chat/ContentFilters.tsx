import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ContentCategory, 
  DifficultyLevel,
  CONTENT_CATEGORY_LABELS,
  DIFFICULTY_LABELS,
  TOPIC_TAG_OPTIONS 
} from '@/types/content';
import { AppRole, ROLE_LABELS } from '@/types/roles';
import { Filter, X } from 'lucide-react';

interface ContentFiltersProps {
  onFiltersChange: (filters: ContentFilterState) => void;
  currentFilters: ContentFilterState;
}

export interface ContentFilterState {
  categories: ContentCategory[];
  targetRoles: AppRole[];
  topicTags: string[];
  timeRange: [number, number];
  difficultyLevels: DifficultyLevel[];
  practicalOnly: boolean;
}

export const ContentFilters = ({ onFiltersChange, currentFilters }: ContentFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<ContentFilterState>(currentFilters);

  const updateFilter = <K extends keyof ContentFilterState>(
    key: K,
    value: ContentFilterState[K]
  ) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const toggleArrayItem = <K extends keyof ContentFilterState>(
    key: K,
    item: any
  ) => {
    const currentArray = localFilters[key] as any[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateFilter(key, newArray as ContentFilterState[K]);
  };

  const resetFilters = () => {
    const defaultFilters: ContentFilterState = {
      categories: [],
      targetRoles: [],
      topicTags: [],
      timeRange: [0, 120],
      difficultyLevels: [],
      practicalOnly: false
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFilterCount = 
    localFilters.categories.length +
    localFilters.targetRoles.length +
    localFilters.topicTags.length +
    localFilters.difficultyLevels.length +
    (localFilters.practicalOnly ? 1 : 0) +
    (localFilters.timeRange[0] > 0 || localFilters.timeRange[1] < 120 ? 1 : 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            סינון תוכן
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </CardTitle>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 ml-1" />
              נקה
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-6">
            {/* Content Categories */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">קטגוריות תוכן</Label>
              <div className="space-y-2">
                {Object.entries(CONTENT_CATEGORY_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`category-${key}`}
                      checked={localFilters.categories.includes(key as ContentCategory)}
                      onCheckedChange={() => toggleArrayItem('categories', key)}
                    />
                    <Label htmlFor={`category-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Topic Tags */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">נושאים</Label>
              <div className="flex flex-wrap gap-2">
                {TOPIC_TAG_OPTIONS.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={localFilters.topicTags.includes(value) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('topicTags', value)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Time Required */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">זמן יישום (דקות)</Label>
                <Badge variant="secondary" className="text-xs">
                  {localFilters.timeRange[0]}-{localFilters.timeRange[1]}
                </Badge>
              </div>
              <Slider
                value={localFilters.timeRange}
                min={0}
                max={120}
                step={5}
                onValueChange={(value) => updateFilter('timeRange', value as [number, number])}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0 דק׳</span>
                <span>120 דק׳</span>
              </div>
            </div>

            <Separator />

            {/* Difficulty Levels */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">רמת קושי</Label>
              <div className="flex gap-2">
                {Object.entries(DIFFICULTY_LABELS).map(([key, label]) => (
                  <Badge
                    key={key}
                    variant={localFilters.difficultyLevels.includes(key as DifficultyLevel) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleArrayItem('difficultyLevels', key)}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            {/* Practical Only */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="practical-only"
                checked={localFilters.practicalOnly}
                onCheckedChange={(checked) => updateFilter('practicalOnly', checked as boolean)}
              />
              <Label htmlFor="practical-only" className="text-sm cursor-pointer">
                תוכן מעשי בלבד
              </Label>
            </div>

            <Separator />

            {/* Target Roles */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">תפקידים רלוונטיים</Label>
              <div className="space-y-2">
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <div key={key} className="flex items-center space-x-2 space-x-reverse">
                    <Checkbox
                      id={`role-${key}`}
                      checked={localFilters.targetRoles.includes(key as AppRole)}
                      onCheckedChange={() => toggleArrayItem('targetRoles', key)}
                    />
                    <Label htmlFor={`role-${key}`} className="text-sm cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export const defaultContentFilters: ContentFilterState = {
  categories: [],
  targetRoles: [],
  topicTags: [],
  timeRange: [0, 120],
  difficultyLevels: [],
  practicalOnly: false
};
