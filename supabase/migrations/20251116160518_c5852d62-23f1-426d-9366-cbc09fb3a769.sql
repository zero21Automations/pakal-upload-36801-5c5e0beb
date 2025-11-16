-- Add enhanced metadata columns to chunks table
ALTER TABLE public.chunks 
ADD COLUMN IF NOT EXISTS content_category TEXT,
ADD COLUMN IF NOT EXISTS target_roles TEXT[],
ADD COLUMN IF NOT EXISTS time_required INTEGER,
ADD COLUMN IF NOT EXISTS topic_tags TEXT[],
ADD COLUMN IF NOT EXISTS methodology_name TEXT,
ADD COLUMN IF NOT EXISTS is_practical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS difficulty_level TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_chunks_content_category ON public.chunks(content_category);
CREATE INDEX IF NOT EXISTS idx_chunks_target_roles ON public.chunks USING GIN(target_roles);
CREATE INDEX IF NOT EXISTS idx_chunks_topic_tags ON public.chunks USING GIN(topic_tags);
CREATE INDEX IF NOT EXISTS idx_chunks_time_required ON public.chunks(time_required) WHERE time_required IS NOT NULL;

-- Create enum for content categories
CREATE TYPE public.content_category_type AS ENUM (
  'leadership',
  'cohesion_methods',
  'rear_support',
  'field_examples',
  'podcasts',
  'success_stories',
  'theory',
  'practical_tools',
  'case_studies'
);

-- Create enum for difficulty levels
CREATE TYPE public.difficulty_level_type AS ENUM (
  'beginner',
  'intermediate',
  'advanced'
);

-- Comment on columns for documentation
COMMENT ON COLUMN public.chunks.content_category IS 'Category of content: leadership, cohesion_methods, rear_support, field_examples, podcasts, success_stories, theory, practical_tools, case_studies';
COMMENT ON COLUMN public.chunks.target_roles IS 'Array of roles this content is relevant for: mentor, cohesion_officer, rear_officer, company_commander, platoon_commander, platoon_cohesion_leader';
COMMENT ON COLUMN public.chunks.time_required IS 'Time required to implement/use this content (in minutes)';
COMMENT ON COLUMN public.chunks.topic_tags IS 'Tags for filtering: relationships, meaning, identity, motivation, communication, planning, etc.';
COMMENT ON COLUMN public.chunks.methodology_name IS 'Name of methodology if this is a specific method (e.g., מתנה/תובנה שקיבלתי)';
COMMENT ON COLUMN public.chunks.is_practical IS 'Whether this is practical/actionable content vs theoretical';
COMMENT ON COLUMN public.chunks.difficulty_level IS 'Difficulty level: beginner, intermediate, advanced';