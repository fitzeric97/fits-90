-- Create style inspirations table (admin-curated looks)
CREATE TABLE public.style_inspirations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    source_url TEXT, -- Pinterest/original source
    image_url TEXT NOT NULL,
    category TEXT, -- 'streetwear', 'formal', 'casual', etc.
    season TEXT, -- 'spring', 'summer', 'fall', 'winter', 'all-season'
    tags TEXT[], -- Array of style tags
    is_active BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tagged products in inspirations
CREATE TABLE public.inspiration_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspiration_id UUID REFERENCES public.style_inspirations(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    brand TEXT,
    product_url TEXT NOT NULL,
    price TEXT, -- Using TEXT to match your existing price fields
    product_type TEXT, -- 'top', 'bottom', 'shoes', 'accessory', etc.
    image_url TEXT,
    affiliate_link TEXT, -- If you use affiliate programs
    position_x FLOAT, -- For tagging position on image (optional)
    position_y FLOAT, -- For tagging position on image (optional)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Track user interactions with inspirations
CREATE TABLE public.inspiration_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    inspiration_id UUID REFERENCES public.style_inspirations(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL, -- 'like', 'save', 'click', 'share'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, inspiration_id, interaction_type)
);

-- Enable Row Level Security
ALTER TABLE public.style_inspirations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspiration_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for style_inspirations
CREATE POLICY "Anyone can view active inspirations" 
ON public.style_inspirations 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Admins can manage inspirations" 
ON public.style_inspirations 
FOR ALL 
USING (auth.uid() = admin_user_id);

-- RLS Policies for inspiration_products
CREATE POLICY "Anyone can view inspiration products" 
ON public.inspiration_products 
FOR SELECT 
USING (EXISTS (
    SELECT 1 FROM public.style_inspirations 
    WHERE id = inspiration_products.inspiration_id 
    AND is_active = true
));

CREATE POLICY "Admins can manage inspiration products" 
ON public.inspiration_products 
FOR ALL 
USING (EXISTS (
    SELECT 1 FROM public.style_inspirations 
    WHERE id = inspiration_products.inspiration_id 
    AND admin_user_id = auth.uid()
));

-- RLS Policies for inspiration_interactions
CREATE POLICY "Users can view their own interactions" 
ON public.inspiration_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own interactions" 
ON public.inspiration_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interactions" 
ON public.inspiration_interactions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions" 
ON public.inspiration_interactions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_inspirations_active ON public.style_inspirations(is_active);
CREATE INDEX idx_inspirations_category ON public.style_inspirations(category);
CREATE INDEX idx_inspirations_created ON public.style_inspirations(created_at DESC);
CREATE INDEX idx_inspirations_season ON public.style_inspirations(season);
CREATE INDEX idx_inspiration_products_inspiration ON public.inspiration_products(inspiration_id);
CREATE INDEX idx_inspiration_interactions_user ON public.inspiration_interactions(user_id);
CREATE INDEX idx_inspiration_interactions_inspiration ON public.inspiration_interactions(inspiration_id);

-- Add updated_at trigger for style_inspirations
CREATE TRIGGER update_style_inspirations_updated_at
    BEFORE UPDATE ON public.style_inspirations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add admin tracking to profiles table if needed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;