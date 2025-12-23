-- Add explicit RLS policies for promo_tokens to satisfy linter while keeping table inaccessible from clients.
-- Promo tokens should be redeemed via SECURITY DEFINER function public.redeem_promo_token.

ALTER TABLE public.promo_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access to promo tokens" ON public.promo_tokens;

CREATE POLICY "No direct access to promo tokens"
ON public.promo_tokens
FOR ALL
USING (false)
WITH CHECK (false);