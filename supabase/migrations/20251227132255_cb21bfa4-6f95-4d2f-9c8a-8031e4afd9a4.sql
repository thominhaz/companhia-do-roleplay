-- Adicionar 'visitante' ao enum subscription_status
ALTER TYPE public.subscription_status ADD VALUE IF NOT EXISTS 'visitante';