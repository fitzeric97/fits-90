-- Create triggers to populate activity feed

-- Trigger for when users like items
CREATE OR REPLACE FUNCTION create_like_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (user_id, actor_id, action_type, target_id, target_type, metadata)
  VALUES (
    NEW.user_id, 
    NEW.user_id, 
    'liked_item', 
    NEW.id, 
    'like',
    jsonb_build_object('title', NEW.title, 'brand_name', NEW.brand_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_like_activity
  AFTER INSERT ON user_likes
  FOR EACH ROW EXECUTE FUNCTION create_like_activity();

-- Trigger for when users add closet items
CREATE OR REPLACE FUNCTION create_closet_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (user_id, actor_id, action_type, target_id, target_type, metadata)
  VALUES (
    NEW.user_id, 
    NEW.user_id, 
    'added_closet', 
    NEW.id, 
    'closet_item',
    jsonb_build_object('product_name', NEW.product_name, 'brand_name', NEW.brand_name)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_closet_activity
  AFTER INSERT ON closet_items
  FOR EACH ROW EXECUTE FUNCTION create_closet_activity();

-- Trigger for when users create fits
CREATE OR REPLACE FUNCTION create_fit_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_feed (user_id, actor_id, action_type, target_id, target_type, metadata)
  VALUES (
    NEW.user_id, 
    NEW.user_id, 
    'created_fit', 
    NEW.id, 
    'fit',
    jsonb_build_object('caption', NEW.caption)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_fit_activity
  AFTER INSERT ON fits
  FOR EACH ROW EXECUTE FUNCTION create_fit_activity();