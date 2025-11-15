-- Create table for pakal terminology/glossary
CREATE TABLE IF NOT EXISTS public.pakal_terms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  term TEXT NOT NULL,
  definition TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL
);

-- Enable RLS
ALTER TABLE public.pakal_terms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view pakal terms"
  ON public.pakal_terms
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create pakal terms"
  ON public.pakal_terms
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can update pakal terms"
  ON public.pakal_terms
  FOR UPDATE
  USING (true)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can delete pakal terms"
  ON public.pakal_terms
  FOR DELETE
  USING (auth.uid() = created_by);

-- Add trigger for updated_at
CREATE TRIGGER update_pakal_terms_updated_at
  BEFORE UPDATE ON public.pakal_terms
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();