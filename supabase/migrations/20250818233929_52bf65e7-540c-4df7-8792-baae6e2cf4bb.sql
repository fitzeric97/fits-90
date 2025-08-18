-- Update fitzeric97@gmail.com to be the only admin user
UPDATE public.profiles 
SET is_admin = CASE 
  WHEN id IN (
    SELECT id FROM auth.users WHERE email = 'fitzeric97@gmail.com'
  ) THEN true 
  ELSE false 
END;

-- If no profile exists for this user, create one as admin
INSERT INTO public.profiles (id, is_admin, gmail_address)
SELECT id, true, 'fitzeric97@gmail.com'
FROM auth.users 
WHERE email = 'fitzeric97@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.profiles WHERE id = auth.users.id
);