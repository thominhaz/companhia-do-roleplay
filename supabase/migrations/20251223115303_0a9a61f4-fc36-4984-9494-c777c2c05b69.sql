-- Primeiro, remover a política problemática
DROP POLICY IF EXISTS "Premium users can create homebrew" ON public.homebrew_content;

-- Criar uma política mais simples que não cause recursão
-- Permitir usuários autenticados inserir seus próprios conteúdos
-- A verificação de premium será feita no frontend/backend
CREATE POLICY "Users can create own homebrew" ON public.homebrew_content
FOR INSERT
WITH CHECK (auth.uid() = user_id);