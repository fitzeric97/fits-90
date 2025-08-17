-- Add first_name and last_name columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Update existing profiles to extract names from display_name where possible
UPDATE public.profiles 
SET 
  first_name = CASE 
    WHEN display_name IS NOT NULL AND position(' ' in display_name) > 0 
    THEN trim(split_part(display_name, ' ', 1))
    ELSE NULL
  END,
  last_name = CASE 
    WHEN display_name IS NOT NULL AND position(' ' in display_name) > 0 
    THEN trim(substring(display_name from position(' ' in display_name) + 1))
    ELSE NULL
  END
WHERE display_name IS NOT NULL AND first_name IS NULL AND last_name IS NULL;