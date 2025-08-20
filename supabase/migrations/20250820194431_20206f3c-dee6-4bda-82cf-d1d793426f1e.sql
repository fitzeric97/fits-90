-- Add public policy for demo user fit tags in preview mode
CREATE POLICY "Public can view demo user fit tags for preview" 
ON fit_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 
    FROM fits 
    WHERE fits.id = fit_tags.fit_id 
    AND fits.user_id = 'eec9fa4a-8e91-4ef7-9469-099426cbbad6'::uuid
  )
);