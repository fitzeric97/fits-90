-- Update RLS policies to allow connected users to view each other's likes and closet items

-- Update user_likes policies to allow connected users to view each other's likes
DROP POLICY IF EXISTS "Users can view their own likes" ON public.user_likes;

CREATE POLICY "Users can view their own likes" 
ON public.user_likes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Connected users can view each other's likes" 
ON public.user_likes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections 
    WHERE ((user_id = auth.uid() AND connected_user_id = user_likes.user_id) 
           OR (connected_user_id = auth.uid() AND user_id = user_likes.user_id))
    AND status = 'accepted'
  )
);

-- Update closet_items policies to allow connected users to view each other's closet items
DROP POLICY IF EXISTS "Users can view their own closet items" ON public.closet_items;

CREATE POLICY "Users can view their own closet items" 
ON public.closet_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Connected users can view each other's closet items" 
ON public.closet_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections 
    WHERE ((user_id = auth.uid() AND connected_user_id = closet_items.user_id) 
           OR (connected_user_id = auth.uid() AND user_id = closet_items.user_id))
    AND status = 'accepted'
  )
);