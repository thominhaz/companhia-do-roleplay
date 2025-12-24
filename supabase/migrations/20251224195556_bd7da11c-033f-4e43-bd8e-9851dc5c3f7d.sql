-- Add discord_user_id to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS discord_user_id TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_discord_user_id ON public.profiles(discord_user_id) WHERE discord_user_id IS NOT NULL;