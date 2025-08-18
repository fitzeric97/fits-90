-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_view_count(inspiration_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.style_inspirations
  SET view_count = view_count + 1
  WHERE id = inspiration_id;
END;
$$;