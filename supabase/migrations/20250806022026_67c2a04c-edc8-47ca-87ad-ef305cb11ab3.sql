-- Add email category column to promotional_emails table
ALTER TABLE public.promotional_emails 
ADD COLUMN email_category TEXT DEFAULT 'promotion' CHECK (email_category IN ('promotion', 'order_confirmation', 'shipping', 'other'));

-- Add email source column to track where the email came from
ALTER TABLE public.promotional_emails 
ADD COLUMN email_source TEXT DEFAULT 'promotional' CHECK (email_source IN ('promotional', 'inbox', 'sent', 'other'));

-- Add order information columns for order confirmations
ALTER TABLE public.promotional_emails 
ADD COLUMN order_number TEXT,
ADD COLUMN order_total TEXT,
ADD COLUMN order_items TEXT;