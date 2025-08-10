-- Create user connections table for managing friendships/connections
CREATE TABLE public.user_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  connected_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'blocked')),
  requested_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, connected_user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;

-- Create policies for user connections
CREATE POLICY "Users can view their own connections" 
ON public.user_connections 
FOR SELECT 
USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can create connection requests" 
ON public.user_connections 
FOR INSERT 
WITH CHECK (auth.uid() = requested_by AND auth.uid() = user_id);

CREATE POLICY "Users can update their connection requests" 
ON public.user_connections 
FOR UPDATE 
USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

CREATE POLICY "Users can delete their connections" 
ON public.user_connections 
FOR DELETE 
USING (auth.uid() = user_id OR auth.uid() = connected_user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_connections_updated_at
BEFORE UPDATE ON public.user_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX idx_user_connections_connected_user_id ON public.user_connections(connected_user_id);
CREATE INDEX idx_user_connections_status ON public.user_connections(status);

-- Update profiles table policies for user discovery
DROP POLICY "Users can view their own profile" ON public.profiles;

-- Create new policies for profiles to allow public discovery
CREATE POLICY "Users can view all profiles for discovery" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);