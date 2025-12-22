-- Create personal notes table for quick notes tool
CREATE TABLE public.personal_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  color TEXT DEFAULT 'default',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.personal_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own notes" 
ON public.personal_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes" 
ON public.personal_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes" 
ON public.personal_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes" 
ON public.personal_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_personal_notes_user_id ON public.personal_notes(user_id);
CREATE INDEX idx_personal_notes_pinned ON public.personal_notes(is_pinned DESC, updated_at DESC);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_personal_notes_updated_at
BEFORE UPDATE ON public.personal_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();