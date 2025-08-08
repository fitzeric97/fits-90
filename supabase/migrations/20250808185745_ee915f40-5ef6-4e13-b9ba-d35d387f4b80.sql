-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily scraping of brand promotions at 8 AM UTC
SELECT cron.schedule(
  'daily-brand-promotion-scrape',
  '0 8 * * *', -- Every day at 8 AM UTC
  $$
  SELECT
    net.http_post(
        url:='https://ijawvesjgyddyiymiahk.supabase.co/functions/v1/scrape-brand-promotions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqYXd2ZXNqZ3lkZHlpeW1pYWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQ2MzgsImV4cCI6MjA3MDAxMDYzOH0.ZFG9EoTGU_gar6cGnu4LYAcsfRXtQQ0yLeq7E3g0CE4"}'::jsonb,
        body:='{"scheduled": true, "timestamp": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);