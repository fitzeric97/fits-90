-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('closet-items', 'closet-items', true);

-- Create closet items table
CREATE TABLE public.closet_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID REFERENCES public.promotional_emails(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  product_name TEXT,
  product_description TEXT,
  product_image_url TEXT,
  stored_image_path TEXT,
  company_website_url TEXT,
  purchase_date TIMESTAMP WITH TIME ZONE,
  order_number TEXT,
  price TEXT,
  size TEXT,
  color TEXT,
  category TEXT, -- 'clothing', 'shoes', 'accessories', etc.
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.closet_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own closet items" 
ON public.closet_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own closet items" 
ON public.closet_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own closet items" 
ON public.closet_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own closet items" 
ON public.closet_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage policies for closet items bucket
CREATE POLICY "Users can view their own closet images"
ON storage.objects FOR SELECT
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own closet images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own closet images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own closet images"
ON storage.objects FOR DELETE
USING (bucket_id = 'closet-items' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at
CREATE TRIGGER update_closet_items_updated_at
BEFORE UPDATE ON public.closet_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();