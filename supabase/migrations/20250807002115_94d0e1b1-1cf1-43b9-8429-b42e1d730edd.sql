-- Add category column to user_likes table if it doesn't exist
ALTER TABLE user_likes 
ADD COLUMN IF NOT EXISTS category text,
ADD COLUMN IF NOT EXISTS item_type text;