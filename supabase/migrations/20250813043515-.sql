-- Create function to create notifications
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
BEGIN
  INSERT INTO public.notifications (user_id, title, description, type, data)
  VALUES (p_user_id, p_title, p_description, p_type, p_data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to notify when new closet items are added
CREATE OR REPLACE FUNCTION public.notify_new_closet_item()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id,
    'New item added to closet',
    'You added "' || COALESCE(NEW.product_name, 'Unknown item') || '" to your closet',
    'closet',
    jsonb_build_object('item_id', NEW.id, 'brand_name', NEW.brand_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when new fits are created
CREATE OR REPLACE FUNCTION public.notify_new_fit()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id,
    'New fit created',
    CASE 
      WHEN NEW.caption IS NOT NULL THEN 'You created a new fit: "' || NEW.caption || '"'
      ELSE 'You created a new fit'
    END,
    'fits',
    jsonb_build_object('fit_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when new likes are added
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id,
    'New item liked',
    'You liked "' || NEW.title || '"' || CASE WHEN NEW.brand_name IS NOT NULL THEN ' from ' || NEW.brand_name ELSE '' END,
    'likes',
    jsonb_build_object('like_id', NEW.id, 'url', NEW.url)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when promotional emails are received
CREATE OR REPLACE FUNCTION public.notify_promotional_email()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.user_id,
    'New promotional email',
    'You received a promotional email from ' || NEW.brand_name || ': "' || NEW.subject || '"',
    'promotion',
    jsonb_build_object('email_id', NEW.id, 'brand_name', NEW.brand_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_notify_new_closet_item
  AFTER INSERT ON public.closet_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_closet_item();

CREATE TRIGGER trigger_notify_new_fit
  AFTER INSERT ON public.fits
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_fit();

CREATE TRIGGER trigger_notify_new_like
  AFTER INSERT ON public.user_likes
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_new_like();

CREATE TRIGGER trigger_notify_promotional_email
  AFTER INSERT ON public.promotional_emails
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_promotional_email();