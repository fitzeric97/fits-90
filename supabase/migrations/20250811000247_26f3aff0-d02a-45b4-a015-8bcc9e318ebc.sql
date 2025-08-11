-- Update RLS policies to allow connected users to view each other's fits

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view their own fits" ON public.fits;

-- Recreate the policy for own fits
CREATE POLICY "Users can view their own fits" 
ON public.fits 
FOR SELECT 
USING (auth.uid() = user_id);

-- Add policy for connected users to view each other's fits
CREATE POLICY "Connected users can view each other's fits" 
ON public.fits 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_connections 
    WHERE ((user_id = auth.uid() AND connected_user_id = fits.user_id) 
           OR (connected_user_id = auth.uid() AND user_id = fits.user_id))
    AND status = 'accepted'
  )
);