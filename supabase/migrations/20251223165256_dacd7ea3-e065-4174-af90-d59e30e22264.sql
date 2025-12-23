-- Corrigir a RLS policy de criação de campanha para usar is_mestre ao invés de is_premium
-- Apenas usuários Mestre podem criar campanhas, não Herói

DROP POLICY IF EXISTS "Premium users can create campaigns" ON public.campaigns;

CREATE POLICY "Mestres can create campaigns" 
ON public.campaigns 
FOR INSERT 
WITH CHECK (auth.uid() = master_id AND is_mestre(auth.uid()));