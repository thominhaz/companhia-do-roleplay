-- Create session attendance table
CREATE TABLE public.session_attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'declined', 'tentative')),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Enable RLS
ALTER TABLE public.session_attendance ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attendance for sessions in their campaigns
CREATE POLICY "Users can view attendance in their campaigns"
ON public.session_attendance
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.campaign_players cp ON cp.campaign_id = s.campaign_id
    WHERE s.id = session_attendance.session_id
    AND cp.user_id = auth.uid()
  )
);

-- Policy: Users can insert their own attendance
CREATE POLICY "Users can insert own attendance"
ON public.session_attendance
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own attendance
CREATE POLICY "Users can update own attendance"
ON public.session_attendance
FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Campaign masters can delete attendance
CREATE POLICY "Masters can delete attendance"
ON public.session_attendance
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.sessions s
    JOIN public.campaigns c ON c.id = s.campaign_id
    WHERE s.id = session_attendance.session_id
    AND c.master_id = auth.uid()
  )
);

-- Enable realtime for attendance updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_attendance;