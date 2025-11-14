-- Create table for core documents (organizational knowledge base)
CREATE TABLE IF NOT EXISTS public.core_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  updated_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.core_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view core documents" 
ON public.core_documents 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create core documents" 
ON public.core_documents 
FOR INSERT 
WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Authenticated users can update core documents" 
ON public.core_documents 
FOR UPDATE 
USING (true)
WITH CHECK (auth.uid() = updated_by);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_core_documents_updated_at
BEFORE UPDATE ON public.core_documents
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Add level field to documents table for content documents
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_level TEXT;

-- Add document type field to distinguish between different document types
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS document_type TEXT DEFAULT 'content';