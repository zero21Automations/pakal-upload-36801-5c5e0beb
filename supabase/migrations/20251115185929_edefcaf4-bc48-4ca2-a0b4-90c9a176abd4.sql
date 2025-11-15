-- Add processing status columns to documents table
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS chunks_count INTEGER DEFAULT 0;

-- Add processing status columns to core_documents table
ALTER TABLE public.core_documents
ADD COLUMN IF NOT EXISTS processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS chunks_count INTEGER DEFAULT 0;

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.documents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.core_documents;

-- Set replica identity for realtime updates
ALTER TABLE public.documents REPLICA IDENTITY FULL;
ALTER TABLE public.core_documents REPLICA IDENTITY FULL;