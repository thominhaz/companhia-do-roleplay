-- Add columns for post-session summary and recap
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS recap TEXT,
ADD COLUMN IF NOT EXISTS highlights TEXT[],
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS xp_awarded INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gold_awarded INTEGER DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN public.sessions.summary IS 'Brief summary of what happened in the session';
COMMENT ON COLUMN public.sessions.recap IS 'Detailed recap/narrative of the session events';
COMMENT ON COLUMN public.sessions.highlights IS 'Key moments or memorable events from the session';
COMMENT ON COLUMN public.sessions.status IS 'Session status: scheduled, completed, or cancelled';
COMMENT ON COLUMN public.sessions.completed_at IS 'When the session was marked as completed';
COMMENT ON COLUMN public.sessions.xp_awarded IS 'Total XP awarded during the session';
COMMENT ON COLUMN public.sessions.gold_awarded IS 'Total gold awarded during the session';