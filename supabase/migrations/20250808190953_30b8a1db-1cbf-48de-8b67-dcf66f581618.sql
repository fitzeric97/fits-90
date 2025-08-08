-- Fix RLS policies for brand_websites table to allow user operations
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Anyone can view brand websites" ON public.brand_websites;

-- Create new policies that allow users to manage brand websites
CREATE POLICY "Users can view all brand websites" 
ON public.brand_websites 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert brand websites" 
ON public.brand_websites 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update brand websites" 
ON public.brand_websites 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete brand websites" 
ON public.brand_websites 
FOR DELETE 
USING (true);