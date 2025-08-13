-- Enable real-time updates for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add notifications table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;