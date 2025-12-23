-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Users can view own documents or all content documents" ON public.documents;

-- Create updated policy that includes padlet documents
CREATE POLICY "Users can view own documents or shared documents" 
ON public.documents 
FOR SELECT 
USING (
  (auth.uid() = user_id) 
  OR (document_type = 'content') 
  OR (document_type = 'padlet')
);