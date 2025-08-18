-- Drop existing triggers to avoid duplicates
DROP TRIGGER IF EXISTS create_like_activity_trigger ON user_likes;
DROP TRIGGER IF EXISTS create_closet_activity_trigger ON closet_items;  
DROP TRIGGER IF EXISTS create_fit_activity_trigger ON fits;

-- Recreate triggers (only once each)
CREATE TRIGGER create_like_activity_trigger 
  AFTER INSERT ON user_likes 
  FOR EACH ROW 
  EXECUTE FUNCTION create_like_activity();

CREATE TRIGGER create_closet_activity_trigger 
  AFTER INSERT ON closet_items 
  FOR EACH ROW 
  EXECUTE FUNCTION create_closet_activity();

CREATE TRIGGER create_fit_activity_trigger 
  AFTER INSERT ON fits 
  FOR EACH ROW 
  EXECUTE FUNCTION create_fit_activity();

-- Clean up existing duplicates
DELETE FROM activity_feed a1 USING activity_feed a2 
WHERE a1.id > a2.id 
  AND a1.target_id = a2.target_id 
  AND a1.action_type = a2.action_type 
  AND a1.actor_id = a2.actor_id
  AND a1.created_at = a2.created_at;