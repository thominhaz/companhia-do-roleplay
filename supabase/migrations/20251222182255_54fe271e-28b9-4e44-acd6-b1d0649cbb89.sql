-- Create table for character change history
CREATE TABLE public.character_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  change_type TEXT NOT NULL DEFAULT 'update',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_character_history_character_id ON public.character_history(character_id);
CREATE INDEX idx_character_history_created_at ON public.character_history(created_at DESC);

-- Enable RLS
ALTER TABLE public.character_history ENABLE ROW LEVEL SECURITY;

-- Users can view history of their own characters
CREATE POLICY "Users can view own character history"
ON public.character_history
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
  AND (
    public.get_subscription_tier(auth.uid()) IN ('heroi', 'mestre')
    OR EXISTS (
      SELECT 1 FROM public.subscriptions 
      WHERE user_id = auth.uid() 
      AND status IN ('premium', 'heroi', 'mestre')
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  )
);

-- Users can insert history for their own characters
CREATE POLICY "Users can insert own character history"
ON public.character_history
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND auth.uid() = user_id
);

-- Users can delete their own character history
CREATE POLICY "Users can delete own character history"
ON public.character_history
FOR DELETE
USING (auth.uid() = user_id);