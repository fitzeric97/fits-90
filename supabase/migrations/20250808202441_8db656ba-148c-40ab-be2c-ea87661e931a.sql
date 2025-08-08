-- Ensure closet-items bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('closet-items', 'closet-items', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create storage policies for closet-items bucket
-- Allow public read access to images
CREATE POLICY "Public read access for closet item images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'closet-items');

-- Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload their own closet item images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'closet-items' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own closet item images
CREATE POLICY "Users can update their own closet item images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'closet-items' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own closet item images
CREATE POLICY "Users can delete their own closet item images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'closet-items' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);