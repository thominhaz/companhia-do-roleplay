-- Add tags column to personal_notes table
ALTER TABLE public.personal_notes 
ADD COLUMN tags text[] DEFAULT '{}'::text[];