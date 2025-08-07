-- Create storage bucket for fits
INSERT INTO storage.buckets (id, name, public) VALUES ('fits', 'fits', true);

-- Create fits table
CREATE TABLE public.fits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  caption TEXT,
  is_instagram_url BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create fit_tags table to link fits with closet items
CREATE TABLE public.fit_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fit_id UUID NOT NULL REFERENCES public.fits(id) ON DELETE CASCADE,
  closet_item_id UUID NOT NULL REFERENCES public.closet_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(fit_id, closet_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.fits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fit_tags ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for fits table
CREATE POLICY "Users can view their own fits" 
ON public.fits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fits" 
ON public.fits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fits" 
ON public.fits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fits" 
ON public.fits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for fit_tags table
CREATE POLICY "Users can view their own fit tags" 
ON public.fit_tags 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.fits 
    WHERE fits.id = fit_tags.fit_id 
    AND fits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create their own fit tags" 
ON public.fit_tags 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fits 
    WHERE fits.id = fit_tags.fit_id 
    AND fits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own fit tags" 
ON public.fit_tags 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.fits 
    WHERE fits.id = fit_tags.fit_id 
    AND fits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own fit tags" 
ON public.fit_tags 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.fits 
    WHERE fits.id = fit_tags.fit_id 
    AND fits.user_id = auth.uid()
  )
);

-- Create storage policies for fits bucket
CREATE POLICY "Users can view fit images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'fits');

CREATE POLICY "Users can upload their own fit images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'fits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own fit images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'fits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own fit images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'fits' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create trigger for automatic timestamp updates on fits
CREATE TRIGGER update_fits_updated_at
BEFORE UPDATE ON public.fits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();