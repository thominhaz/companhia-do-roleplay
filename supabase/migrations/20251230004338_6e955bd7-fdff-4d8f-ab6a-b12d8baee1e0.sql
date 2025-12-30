-- Add email field to supporter_submissions
ALTER TABLE public.supporter_submissions
ADD COLUMN email TEXT;