-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Create chunks table for storing document embeddings
CREATE TABLE public.chunks (
  id TEXT PRIMARY KEY,
  org_id TEXT NOT NULL,
  unit_id TEXT,
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('core_document', 'content_document')),
  content TEXT NOT NULL,
  embedding vector(1536),
  level INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'approved',
  metadata JSONB,
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX chunks_embedding_idx ON public.chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX chunks_org_id_idx ON public.chunks(org_id);
CREATE INDEX chunks_source_id_idx ON public.chunks(source_id);
CREATE INDEX chunks_level_idx ON public.chunks(level);
CREATE INDEX chunks_source_type_idx ON public.chunks(source_type);

-- Enable RLS
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chunks
CREATE POLICY "Authenticated users can view chunks"
ON public.chunks
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert chunks"
ON public.chunks
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update chunks"
ON public.chunks
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete chunks"
ON public.chunks
FOR DELETE
TO authenticated
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_chunks_updated_at
BEFORE UPDATE ON public.chunks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();