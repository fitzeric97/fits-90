-- Create unsubscribed brands table
CREATE TABLE public.unsubscribed_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  unsubscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, brand_name)
);

-- Enable RLS
ALTER TABLE public.unsubscribed_brands ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own unsubscribed brands" 
ON public.unsubscribed_brands 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unsubscribed brands" 
ON public.unsubscribed_brands 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own unsubscribed brands" 
ON public.unsubscribed_brands 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own unsubscribed brands" 
ON public.unsubscribed_brands 
FOR DELETE 
USING (auth.uid() = user_id);