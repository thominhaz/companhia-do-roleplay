-- Add tier column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'promo_tokens' 
    AND column_name = 'tier'
  ) THEN
    ALTER TABLE public.promo_tokens ADD COLUMN tier text NOT NULL DEFAULT 'mestre';
  END IF;
END $$;

-- Insert the 4 test tokens
INSERT INTO public.promo_tokens (code, days_premium, max_uses, expires_at, is_active, tier) VALUES
  ('HEROI30', 30, 100, '2025-12-31 23:59:59+00', true, 'heroi'),
  ('HEROIVIP', 36500, 50, '2025-12-31 23:59:59+00', true, 'heroi'),
  ('MESTRE30', 30, 100, '2025-12-31 23:59:59+00', true, 'mestre'),
  ('MESTREVIP', 36500, 50, '2025-12-31 23:59:59+00', true, 'mestre');