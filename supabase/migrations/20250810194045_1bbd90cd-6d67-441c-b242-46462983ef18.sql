-- Create table for storing Instagram connections
CREATE TABLE public.instagram_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  instagram_username TEXT NOT NULL,
  instagram_user_id TEXT NOT NULL,
  access_token TEXT,
  connected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, instagram_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for Instagram connections
CREATE POLICY "Users can view their own Instagram connections" 
ON public.instagram_connections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own Instagram connections" 
ON public.instagram_connections 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Instagram connections" 
ON public.instagram_connections 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Instagram connections" 
ON public.instagram_connections 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_instagram_connections_updated_at
BEFORE UPDATE ON public.instagram_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();