-- Add order field to fit_tags table to support reordering
ALTER TABLE public.fit_tags 
ADD COLUMN item_order INTEGER DEFAULT 0;

-- Update existing records to have sequential order based on created_at
WITH ordered_tags AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY fit_id ORDER BY created_at) - 1 as new_order
  FROM public.fit_tags
)
UPDATE public.fit_tags 
SET item_order = ordered_tags.new_order
FROM ordered_tags
WHERE fit_tags.id = ordered_tags.id;