-- Create chat_turns table for storing conversation analytics
CREATE TABLE public.chat_turns (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  unit_id TEXT,
  user_id UUID NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  mode TEXT DEFAULT 'insights',
  retrieval_meta JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create citations table to track source citations per turn
CREATE TABLE public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id TEXT REFERENCES public.chat_turns(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  chunk_id TEXT NOT NULL,
  level INTEGER,
  confidence REAL,
  excerpt TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_chat_turns_org_id ON public.chat_turns(org_id);
CREATE INDEX idx_chat_turns_user_id ON public.chat_turns(user_id);
CREATE INDEX idx_chat_turns_created_at ON public.chat_turns(created_at DESC);
CREATE INDEX idx_citations_turn_id ON public.citations(turn_id);
CREATE INDEX idx_citations_source_id ON public.citations(source_id);

-- Enable RLS
ALTER TABLE public.chat_turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;

-- RLS policies for chat_turns - user-based only
CREATE POLICY "Users can view their own chat turns"
ON public.chat_turns
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat turns"
ON public.chat_turns
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for citations
CREATE POLICY "Users can view citations for their turns"
ON public.citations
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chat_turns
  WHERE chat_turns.id = citations.turn_id
  AND chat_turns.user_id = auth.uid()
));

CREATE POLICY "Users can insert citations for their turns"
ON public.citations
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.chat_turns
  WHERE chat_turns.id = citations.turn_id
  AND chat_turns.user_id = auth.uid()
));

-- Enable realtime for analytics
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_turns;