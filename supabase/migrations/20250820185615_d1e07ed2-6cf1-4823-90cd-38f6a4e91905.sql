-- Allow public read access to demo user's likes for preview
CREATE POLICY "Public can view demo user likes for preview"
ON user_likes FOR SELECT
USING (user_id = 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');

-- Allow public read access to demo user's closet items for preview  
CREATE POLICY "Public can view demo user closet items for preview"
ON closet_items FOR SELECT
USING (user_id = 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');

-- Allow public read access to demo user's fits for preview
CREATE POLICY "Public can view demo user fits for preview" 
ON fits FOR SELECT
USING (user_id = 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');

-- Allow public read access to demo user's profile for preview
CREATE POLICY "Public can view demo user profile for preview"
ON profiles FOR SELECT  
USING (id = 'eec9fa4a-8e91-4ef7-9469-099426cbbad6');