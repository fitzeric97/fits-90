-- Create table for multiple Gmail accounts per user
CREATE TABLE public.connected_gmail_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gmail_address TEXT NOT NULL,
  display_name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, gmail_address)
);

-- Enable Row Level Security
ALTER TABLE public.connected_gmail_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own connected accounts" 
ON public.connected_gmail_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connected accounts" 
ON public.connected_gmail_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connected accounts" 
ON public.connected_gmail_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connected accounts" 
ON public.connected_gmail_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_connected_gmail_accounts_updated_at
BEFORE UPDATE ON public.connected_gmail_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update user_gmail_tokens table to support multiple accounts
ALTER TABLE public.user_gmail_tokens 
ADD COLUMN gmail_address TEXT;

-- Create unique constraint for user_id + gmail_address combination
ALTER TABLE public.user_gmail_tokens 
DROP CONSTRAINT IF EXISTS user_gmail_tokens_user_id_key;

-- Add unique constraint for user_id + gmail_address
ALTER TABLE public.user_gmail_tokens 
ADD CONSTRAINT user_gmail_tokens_user_gmail_unique 
UNIQUE (user_id, gmail_address);

-- Migrate existing data from profiles to connected_gmail_accounts
INSERT INTO public.connected_gmail_accounts (user_id, gmail_address, is_primary, created_at)
SELECT id, gmail_address, true, created_at
FROM public.profiles 
WHERE gmail_address IS NOT NULL;

-- Update existing tokens with gmail addresses from profiles
UPDATE public.user_gmail_tokens 
SET gmail_address = (
  SELECT gmail_address 
  FROM public.profiles 
  WHERE profiles.id = user_gmail_tokens.user_id 
  AND profiles.gmail_address IS NOT NULL
)
WHERE gmail_address IS NULL;