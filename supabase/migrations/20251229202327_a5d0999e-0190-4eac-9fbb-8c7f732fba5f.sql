-- Table for supporter content submissions (pending approval)
CREATE TABLE public.supporter_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code TEXT NOT NULL,
  submission_type TEXT NOT NULL CHECK (submission_type IN ('npc', 'item')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Creator info
  creator_name TEXT NOT NULL,
  creator_tier TEXT NOT NULL,
  creator_message TEXT,
  
  -- Submission data (JSON with all fields)
  data JSONB NOT NULL,
  
  -- Admin response
  admin_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supporter_submissions ENABLE ROW LEVEL SECURITY;

-- Public can insert (submit)
CREATE POLICY "Anyone can submit supporter content"
ON public.supporter_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view/update submissions
CREATE POLICY "Admins can view all submissions"
ON public.supporter_submissions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update submissions"
ON public.supporter_submissions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Index for faster queries
CREATE INDEX idx_supporter_submissions_status ON public.supporter_submissions(status);
CREATE INDEX idx_supporter_submissions_promo_code ON public.supporter_submissions(promo_code);