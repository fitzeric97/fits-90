-- Create table for scraped brand promotions
CREATE TABLE public.scraped_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  brand_name TEXT NOT NULL,
  brand_website_url TEXT NOT NULL,
  promotion_title TEXT NOT NULL,
  promotion_description TEXT,
  promotion_url TEXT,
  discount_percentage TEXT,
  discount_code TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.scraped_promotions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own scraped promotions" 
ON public.scraped_promotions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own scraped promotions" 
ON public.scraped_promotions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scraped promotions" 
ON public.scraped_promotions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scraped promotions" 
ON public.scraped_promotions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_scraped_promotions_updated_at
BEFORE UPDATE ON public.scraped_promotions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create table to track brand websites for scraping
CREATE TABLE public.brand_websites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_name TEXT NOT NULL UNIQUE,
  website_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  scraping_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security for brand_websites
ALTER TABLE public.brand_websites ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_websites (admin-managed, but readable by all users)
CREATE POLICY "Anyone can view brand websites" 
ON public.brand_websites 
FOR SELECT 
USING (true);

-- Create trigger for brand_websites timestamp updates
CREATE TRIGGER update_brand_websites_updated_at
BEFORE UPDATE ON public.brand_websites
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some common fashion brand websites for scraping
INSERT INTO public.brand_websites (brand_name, website_url) VALUES
('Nike', 'https://www.nike.com'),
('Adidas', 'https://www.adidas.com'),
('Zara', 'https://www.zara.com'),
('H&M', 'https://www2.hm.com'),
('Uniqlo', 'https://www.uniqlo.com'),
('Gap', 'https://www.gap.com'),
('Old Navy', 'https://oldnavy.gap.com'),
('Banana Republic', 'https://bananarepublic.gap.com'),
('J.Crew', 'https://www.jcrew.com'),
('Madewell', 'https://www.madewell.com');

-- Create index for better performance
CREATE INDEX idx_scraped_promotions_user_brand ON public.scraped_promotions(user_id, brand_name);
CREATE INDEX idx_scraped_promotions_active ON public.scraped_promotions(is_active, scraped_at);
CREATE INDEX idx_brand_websites_active ON public.brand_websites(is_active, scraping_enabled);