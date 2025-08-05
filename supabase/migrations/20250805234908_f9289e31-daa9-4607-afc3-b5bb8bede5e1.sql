-- Create table for storing promotional emails
CREATE TABLE public.promotional_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gmail_message_id TEXT NOT NULL UNIQUE,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  brand_name TEXT NOT NULL,
  subject TEXT NOT NULL,
  snippet TEXT,
  body_html TEXT,
  body_text TEXT,
  received_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_expired BOOLEAN DEFAULT FALSE,
  labels TEXT[],
  thread_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.promotional_emails ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own emails" 
ON public.promotional_emails 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emails" 
ON public.promotional_emails 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own emails" 
ON public.promotional_emails 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own emails" 
ON public.promotional_emails 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_promotional_emails_user_id ON public.promotional_emails(user_id);
CREATE INDEX idx_promotional_emails_brand_name ON public.promotional_emails(brand_name);
CREATE INDEX idx_promotional_emails_received_date ON public.promotional_emails(received_date DESC);
CREATE INDEX idx_promotional_emails_expires_at ON public.promotional_emails(expires_at);

-- Create table for user Gmail tokens
CREATE TABLE public.user_gmail_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_gmail_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for token access
CREATE POLICY "Users can manage their own tokens" 
ON public.user_gmail_tokens 
FOR ALL 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_promotional_emails_updated_at
BEFORE UPDATE ON public.promotional_emails
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_gmail_tokens_updated_at
BEFORE UPDATE ON public.user_gmail_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();