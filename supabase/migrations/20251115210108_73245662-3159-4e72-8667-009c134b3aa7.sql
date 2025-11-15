-- Add DELETE policy for core_documents
CREATE POLICY "Authenticated users can delete core documents"
ON public.core_documents
FOR DELETE
TO authenticated
USING (true);

-- Update chunks table to cascade delete when source is removed
-- First, let's add a policy to allow deleting chunks related to core documents
CREATE POLICY "Authenticated users can delete core document chunks"
ON public.chunks
FOR DELETE
TO authenticated
USING (source_type = 'core_document');