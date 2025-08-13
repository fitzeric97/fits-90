-- Update the create_notification function to respect user preferences
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_type TEXT DEFAULT 'general',
  p_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  user_preference RECORD;
BEGIN
  -- Check if user has this notification type enabled
  SELECT enabled INTO user_preference
  FROM public.notification_preferences 
  WHERE user_id = p_user_id AND notification_type = p_type;
  
  -- Only create notification if user has it enabled (default to true if no preference found)
  IF user_preference.enabled IS NULL OR user_preference.enabled = true THEN
    INSERT INTO public.notifications (user_id, title, description, type, data)
    VALUES (p_user_id, p_title, p_description, p_type, p_data)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
  END IF;
  
  -- Return NULL if notification was not created due to user preference
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;