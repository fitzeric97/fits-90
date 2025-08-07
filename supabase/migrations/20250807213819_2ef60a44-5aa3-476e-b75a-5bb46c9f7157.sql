-- Fix storage policies for fits bucket
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view fit images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own fit images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own fit images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own fit images" ON storage.objects;

-- Create corrected storage policies for fits bucket
CREATE POLICY "Anyone can view fit images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fits');

CREATE POLICY "Authenticated users can upload fit images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'fits' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own fit images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'fits' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own fit images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'fits' 
  AND auth.role() = 'authenticated'
);