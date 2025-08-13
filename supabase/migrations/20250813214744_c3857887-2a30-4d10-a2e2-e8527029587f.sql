-- Fix notification functions to handle missing net extension gracefully
CREATE OR REPLACE FUNCTION public.notify_new_like()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id UUID;
  like_description TEXT;
  net_available BOOLEAN DEFAULT FALSE;
BEGIN
  like_description := 'You liked "' || NEW.title || '"' || CASE WHEN NEW.brand_name IS NOT NULL THEN ' from ' || NEW.brand_name ELSE '' END;

  -- Create the in-app notification
  notification_id := public.create_notification(
    NEW.user_id,
    'New item liked',
    like_description,
    'likes',
    jsonb_build_object('like_id', NEW.id, 'url', NEW.url)
  );
  
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO net_available;
  
  -- If notification was created and net extension is available, send email
  IF notification_id IS NOT NULL AND net_available THEN
    BEGIN
      -- Call email notification function asynchronously
      PERFORM net.http_post(
        url := concat(current_setting('app.supabase_url'), '/functions/v1/send-email-notification'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'user_id', NEW.user_id,
          'notification_type', 'likes',
          'title', 'New item liked',
          'description', like_description,
          'data', jsonb_build_object('like_id', NEW.id, 'url', NEW.url)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore HTTP notification errors
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Fix other notification functions similarly
CREATE OR REPLACE FUNCTION public.notify_new_closet_item()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id UUID;
  net_available BOOLEAN DEFAULT FALSE;
BEGIN
  -- Create the in-app notification
  notification_id := public.create_notification(
    NEW.user_id,
    'New item added to closet',
    'You added "' || COALESCE(NEW.product_name, 'Unknown item') || '" to your closet',
    'closet',
    jsonb_build_object('item_id', NEW.id, 'brand_name', NEW.brand_name)
  );
  
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO net_available;
  
  -- If notification was created and net extension is available, send email
  IF notification_id IS NOT NULL AND net_available THEN
    BEGIN
      -- Call email notification function asynchronously
      PERFORM net.http_post(
        url := concat(current_setting('app.supabase_url'), '/functions/v1/send-email-notification'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'user_id', NEW.user_id,
          'notification_type', 'closet',
          'title', 'New item added to closet',
          'description', 'You added "' || COALESCE(NEW.product_name, 'Unknown item') || '" to your closet',
          'data', jsonb_build_object('item_id', NEW.id, 'brand_name', NEW.brand_name)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore HTTP notification errors
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_new_fit()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id UUID;
  fit_description TEXT;
  net_available BOOLEAN DEFAULT FALSE;
BEGIN
  fit_description := CASE 
    WHEN NEW.caption IS NOT NULL THEN 'You created a new fit: "' || NEW.caption || '"'
    ELSE 'You created a new fit'
  END;

  -- Create the in-app notification
  notification_id := public.create_notification(
    NEW.user_id,
    'New fit created',
    fit_description,
    'fits',
    jsonb_build_object('fit_id', NEW.id)
  );
  
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO net_available;
  
  -- If notification was created and net extension is available, send email
  IF notification_id IS NOT NULL AND net_available THEN
    BEGIN
      -- Call email notification function asynchronously
      PERFORM net.http_post(
        url := concat(current_setting('app.supabase_url'), '/functions/v1/send-email-notification'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'user_id', NEW.user_id,
          'notification_type', 'fits',
          'title', 'New fit created',
          'description', fit_description,
          'data', jsonb_build_object('fit_id', NEW.id)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore HTTP notification errors
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_promotional_email()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  notification_id UUID;
  promo_description TEXT;
  net_available BOOLEAN DEFAULT FALSE;
BEGIN
  promo_description := 'You received a promotional email from ' || NEW.brand_name || ': "' || NEW.subject || '"';

  -- Create the in-app notification
  notification_id := public.create_notification(
    NEW.user_id,
    'New promotional email',
    promo_description,
    'promotion',
    jsonb_build_object('email_id', NEW.id, 'brand_name', NEW.brand_name)
  );
  
  -- Check if net extension is available
  SELECT EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'http'
  ) INTO net_available;
  
  -- If notification was created and net extension is available, send email
  IF notification_id IS NOT NULL AND net_available THEN
    BEGIN
      -- Call email notification function asynchronously
      PERFORM net.http_post(
        url := concat(current_setting('app.supabase_url'), '/functions/v1/send-email-notification'),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', concat('Bearer ', current_setting('app.supabase_service_role_key'))
        ),
        body := jsonb_build_object(
          'user_id', NEW.user_id,
          'notification_type', 'promotion',
          'title', 'New promotional email',
          'description', promo_description,
          'data', jsonb_build_object('email_id', NEW.id, 'brand_name', NEW.brand_name)
        )
      );
    EXCEPTION WHEN OTHERS THEN
      -- Silently ignore HTTP notification errors
      NULL;
    END;
  END IF;
  
  RETURN NEW;
END;
$function$;