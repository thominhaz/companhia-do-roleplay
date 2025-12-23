-- Add discord_webhook_url column to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN discord_webhook_url TEXT DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.campaigns.discord_webhook_url IS 'Discord webhook URL for sending notifications to the campaign Discord channel';