-- Add uploaded image columns to user_likes and closet_items tables
ALTER TABLE public.user_likes 
ADD COLUMN uploaded_image_url text;

ALTER TABLE public.closet_items 
ADD COLUMN uploaded_image_url text;

-- Create storage bucket for item images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('item-images', 'item-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for item images
CREATE POLICY "Users can view item images"
ON storage.objects FOR SELECT
USING (bucket_id = 'item-images');

CREATE POLICY "Users can upload their own item images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own item images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own item images"
ON storage.objects FOR DELETE
USING (bucket_id = 'item-images' AND auth.uid()::text = (storage.foldername(name))[1]);