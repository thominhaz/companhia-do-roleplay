-- Create enum for homebrew content types
CREATE TYPE public.homebrew_content_type AS ENUM (
  'spell',
  'item', 
  'race',
  'class',
  'subclass',
  'monster',
  'background',
  'feat'
);

-- Create enum for content source
CREATE TYPE public.homebrew_source AS ENUM (
  'user',
  'master_shared',
  'community'
);

-- Main homebrew content table
CREATE TABLE public.homebrew_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type homebrew_content_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '✨',
  data JSONB NOT NULL DEFAULT '{}',
  source homebrew_source NOT NULL DEFAULT 'user',
  is_public BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for sharing homebrew with campaigns
CREATE TABLE public.homebrew_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.homebrew_content(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  shared_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(content_id, campaign_id)
);

-- Enable RLS
ALTER TABLE public.homebrew_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homebrew_shares ENABLE ROW LEVEL SECURITY;

-- Function to count user's homebrew content
CREATE OR REPLACE FUNCTION public.count_user_homebrew(_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      COALESCE(COUNT(*)::INTEGER, 0)
    ELSE 0
  END
  FROM public.homebrew_content 
  WHERE user_id = _user_id;
$$;

-- Function to check if user can create homebrew (based on subscription tier)
CREATE OR REPLACE FUNCTION public.can_create_homebrew(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      -- Premium users have unlimited, free users can't create
      public.is_premium(_user_id)
    ELSE FALSE
  END;
$$;

-- Function to check if user can create homebrew with limit (for future Hero tier)
CREATE OR REPLACE FUNCTION public.can_create_homebrew_with_limit(_user_id UUID, _limit INTEGER DEFAULT 100)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN auth.uid() = _user_id THEN
      public.is_premium(_user_id) OR public.count_user_homebrew(_user_id) < _limit
    ELSE FALSE
  END;
$$;

-- Function to check if user has access to homebrew content (owner, master shared, or public)
CREATE OR REPLACE FUNCTION public.has_homebrew_access(_content_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = _content_id
    AND (
      -- Owner
      hc.user_id = _user_id
      -- Or public content
      OR hc.is_public = true
      -- Or shared with a campaign the user is part of
      OR EXISTS (
        SELECT 1 FROM public.homebrew_shares hs
        JOIN public.campaign_players cp ON cp.campaign_id = hs.campaign_id
        WHERE hs.content_id = hc.id AND cp.user_id = _user_id
      )
      -- Or shared with a campaign the user masters
      OR EXISTS (
        SELECT 1 FROM public.homebrew_shares hs
        JOIN public.campaigns c ON c.id = hs.campaign_id
        WHERE hs.content_id = hc.id AND c.master_id = _user_id
      )
    )
  );
$$;

-- RLS Policies for homebrew_content

-- Users can view their own content
CREATE POLICY "Users can view own homebrew"
ON public.homebrew_content
FOR SELECT
USING (auth.uid() = user_id);

-- Users can view public homebrew
CREATE POLICY "Users can view public homebrew"
ON public.homebrew_content
FOR SELECT
USING (is_public = true);

-- Users can view homebrew shared with their campaigns
CREATE POLICY "Users can view campaign shared homebrew"
ON public.homebrew_content
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_shares hs
    JOIN public.campaign_players cp ON cp.campaign_id = hs.campaign_id
    WHERE hs.content_id = homebrew_content.id AND cp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.homebrew_shares hs
    JOIN public.campaigns c ON c.id = hs.campaign_id
    WHERE hs.content_id = homebrew_content.id AND c.master_id = auth.uid()
  )
);

-- Premium users can create homebrew
CREATE POLICY "Premium users can create homebrew"
ON public.homebrew_content
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND public.can_create_homebrew(auth.uid())
);

-- Users can update their own homebrew
CREATE POLICY "Users can update own homebrew"
ON public.homebrew_content
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own homebrew
CREATE POLICY "Users can delete own homebrew"
ON public.homebrew_content
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for homebrew_shares

-- Content owners and campaign masters can view shares
CREATE POLICY "Owners and masters can view shares"
ON public.homebrew_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Only content owners can share (and they must be campaign master)
CREATE POLICY "Owners can share to their campaigns"
ON public.homebrew_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Content owners or campaign masters can remove shares
CREATE POLICY "Owners and masters can delete shares"
ON public.homebrew_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.homebrew_content hc
    WHERE hc.id = homebrew_shares.content_id AND hc.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.campaigns c
    WHERE c.id = homebrew_shares.campaign_id AND c.master_id = auth.uid()
  )
);

-- Add updated_at trigger for homebrew_content
CREATE TRIGGER update_homebrew_content_updated_at
BEFORE UPDATE ON public.homebrew_content
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_homebrew_content_user_id ON public.homebrew_content(user_id);
CREATE INDEX idx_homebrew_content_type ON public.homebrew_content(type);
CREATE INDEX idx_homebrew_content_is_public ON public.homebrew_content(is_public) WHERE is_public = true;
CREATE INDEX idx_homebrew_shares_content_id ON public.homebrew_shares(content_id);
CREATE INDEX idx_homebrew_shares_campaign_id ON public.homebrew_shares(campaign_id);