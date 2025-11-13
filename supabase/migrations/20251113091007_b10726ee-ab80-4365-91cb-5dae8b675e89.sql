-- Create documents table
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  content_type TEXT,
  status TEXT NOT NULL DEFAULT 'ממתין לאישור',
  description TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Documents policies
CREATE POLICY "Users can view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- Create document_mappings table
CREATE TABLE public.document_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  org_id TEXT NOT NULL,
  unit_id TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  leadership JSONB,
  demographics JSONB,
  operational_capability JSONB,
  training_education JSONB,
  welfare_morale JSONB,
  discipline_culture JSONB,
  updated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(org_id, unit_id)
);

-- Enable RLS on document_mappings
ALTER TABLE public.document_mappings ENABLE ROW LEVEL SECURITY;

-- Document mappings policies
CREATE POLICY "Authenticated users can view document mappings"
  ON public.document_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert document mappings"
  ON public.document_mappings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Authenticated users can update document mappings"
  ON public.document_mappings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (auth.uid() = updated_by);

CREATE POLICY "Authenticated users can delete document mappings"
  ON public.document_mappings FOR DELETE
  TO authenticated
  USING (true);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Trigger for updated_at on documents
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_documents
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_document_mappings
  BEFORE UPDATE ON public.document_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();