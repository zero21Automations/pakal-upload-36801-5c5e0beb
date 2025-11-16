import { AppRole } from './roles';

export type ContentCategory = 
  | 'leadership'
  | 'cohesion_methods'
  | 'rear_support'
  | 'field_examples'
  | 'podcasts'
  | 'success_stories'
  | 'theory'
  | 'practical_tools'
  | 'case_studies';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ChunkMetadata {
  content_category?: ContentCategory;
  target_roles?: AppRole[];
  time_required?: number;
  topic_tags?: string[];
  methodology_name?: string;
  is_practical?: boolean;
  difficulty_level?: DifficultyLevel;
}

export const CONTENT_CATEGORY_LABELS: Record<ContentCategory, string> = {
  leadership: 'מנהיגות',
  cohesion_methods: 'מתודות לכידות',
  rear_support: 'תמיכת עורף',
  field_examples: 'דוגמאות מהשטח',
  podcasts: 'פודקאסטים',
  success_stories: 'סיפורי הצלחה',
  theory: 'תיאוריה',
  practical_tools: 'כלים מעשיים',
  case_studies: 'מקרי בוחן'
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'מתחיל',
  intermediate: 'בינוני',
  advanced: 'מתקדם'
};

export const TOPIC_TAG_OPTIONS = [
  { value: 'relationships', label: 'קשרים' },
  { value: 'meaning', label: 'משמעות' },
  { value: 'identity', label: 'זהות' },
  { value: 'motivation', label: 'מוטיבציה' },
  { value: 'communication', label: 'תקשורת' },
  { value: 'planning', label: 'תכנון' },
  { value: 'execution', label: 'ביצוע' },
  { value: 'feedback', label: 'משוב' },
  { value: 'resilience', label: 'חוסן' },
  { value: 'teamwork', label: 'עבודת צוות' },
  { value: 'hierarchy', label: 'היררכיה' },
  { value: 'partnership', label: 'שותפות' },
];
