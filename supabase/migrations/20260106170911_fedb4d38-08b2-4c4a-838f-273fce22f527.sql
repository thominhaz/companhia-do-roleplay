-- Tighten supporter_submissions INSERT policy (removes permissive WITH CHECK (true))
DROP POLICY IF EXISTS "Anyone can submit supporter content" ON public.supporter_submissions;

CREATE POLICY "Anyone can submit supporter content"
ON public.supporter_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.promo_tokens pt
    WHERE pt.code = supporter_submissions.promo_code
      AND pt.is_active = true
  )
);
