-- Update function to create activity when user likes an item
CREATE OR REPLACE FUNCTION create_like_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (
    user_id,
    actor_id,
    action_type,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'liked_item',
    NEW.id,
    'like',
    jsonb_build_object(
      'item_name', NEW.title,
      'item_image', COALESCE(NEW.uploaded_image_url, NEW.image_url),
      'brand_name', NEW.brand_name,
      'price', NEW.price
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function to create activity when user adds closet item
CREATE OR REPLACE FUNCTION create_closet_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (
    user_id,
    actor_id,
    action_type,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'added_closet',
    NEW.id,
    'closet_item',
    jsonb_build_object(
      'item_name', NEW.product_name,
      'item_image', COALESCE(NEW.uploaded_image_url, NEW.product_image_url),
      'brand_name', NEW.brand_name,
      'price', NEW.price
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update function to create activity when user creates a fit
CREATE OR REPLACE FUNCTION create_fit_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (
    user_id,
    actor_id,
    action_type,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    NEW.user_id,
    NEW.user_id,
    'created_fit',
    NEW.id,
    'fit',
    jsonb_build_object(
      'fit_caption', NEW.caption,
      'item_image', NEW.image_url
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS on_like_created ON user_likes;
DROP TRIGGER IF EXISTS on_closet_item_created ON closet_items;
DROP TRIGGER IF EXISTS on_fit_created ON fits;

-- Create triggers
CREATE TRIGGER on_like_created
AFTER INSERT ON user_likes
FOR EACH ROW
EXECUTE FUNCTION create_like_activity();

CREATE TRIGGER on_closet_item_created
AFTER INSERT ON closet_items
FOR EACH ROW
EXECUTE FUNCTION create_closet_activity();

CREATE TRIGGER on_fit_created
AFTER INSERT ON fits
FOR EACH ROW
EXECUTE FUNCTION create_fit_activity();

-- Update RLS policies for activity_feed (using user_connections instead of user_follows)
DROP POLICY IF EXISTS "Users can see activities from followed users" ON activity_feed;

-- Users can see activities from connected users (accepted connections)
CREATE POLICY "Users can see activities from connected users" ON activity_feed
FOR SELECT
USING (
  actor_id IN (
    SELECT CASE 
      WHEN user_id = auth.uid() THEN connected_user_id
      WHEN connected_user_id = auth.uid() THEN user_id
    END
    FROM user_connections 
    WHERE (user_id = auth.uid() OR connected_user_id = auth.uid())
    AND status = 'accepted'
  )
  OR actor_id = auth.uid()
);