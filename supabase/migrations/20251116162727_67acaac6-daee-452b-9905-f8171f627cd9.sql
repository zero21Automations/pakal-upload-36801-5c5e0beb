-- Drop the existing restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

-- Create new policy: users can view their own documents OR any content documents
CREATE POLICY "Users can view own documents or all content documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  OR document_type = 'content'
);