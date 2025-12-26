-- Add column to control if players can see their reputation with this faction
ALTER TABLE public.campaign_factions 
ADD COLUMN show_reputation_to_players BOOLEAN NOT NULL DEFAULT false;