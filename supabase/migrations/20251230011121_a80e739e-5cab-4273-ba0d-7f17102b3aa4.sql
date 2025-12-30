-- Drop the restrictive policy
DROP POLICY IF EXISTS "No direct access to promo tokens" ON public.promo_tokens;

-- Allow public read access to active promo tokens (for code validation)
CREATE POLICY "Anyone can read active promo tokens for validation"
ON public.promo_tokens
FOR SELECT
USING (is_active = true);