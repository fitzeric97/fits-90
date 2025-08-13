-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notification preferences" 
ON public.notification_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences" 
ON public.notification_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" 
ON public.notification_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notification preferences" 
ON public.notification_preferences 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default preferences for existing users
INSERT INTO public.notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
SELECT 
  p.id,
  unnest(ARRAY['closet', 'fits', 'likes', 'promotion', 'general']) as notification_type,
  true as enabled,
  false as email_enabled,
  true as push_enabled
FROM public.profiles p
ON CONFLICT (user_id, notification_type) DO NOTHING;

-- Create function to initialize default preferences for new users
CREATE OR REPLACE FUNCTION public.create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id, notification_type, enabled, email_enabled, push_enabled)
  VALUES 
    (NEW.id, 'closet', true, false, true),
    (NEW.id, 'fits', true, false, true),
    (NEW.id, 'likes', true, false, true),
    (NEW.id, 'promotion', true, false, true),
    (NEW.id, 'general', true, false, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run when a new profile is created
CREATE TRIGGER trigger_create_default_notification_preferences
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_notification_preferences();