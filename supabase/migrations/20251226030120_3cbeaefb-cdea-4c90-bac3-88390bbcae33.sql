-- Drop existing problematic policies
DROP POLICY IF EXISTS "Masters can manage their campaign documents" ON public.campaign_documents;
DROP POLICY IF EXISTS "Players can view documents delivered to them" ON public.campaign_documents;
DROP POLICY IF EXISTS "Masters can manage deliveries for their campaigns" ON public.campaign_document_deliveries;
DROP POLICY IF EXISTS "Players can view and update their own deliveries" ON public.campaign_document_deliveries;
DROP POLICY IF EXISTS "Players can update their own deliveries" ON public.campaign_document_deliveries;

-- Create helper function to check if user has access to a document
CREATE OR REPLACE FUNCTION public.has_document_access(_document_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.campaign_document_deliveries cdd
    JOIN public.characters c ON c.id = cdd.character_id
    WHERE cdd.document_id = _document_id
    AND c.user_id = _user_id
  );
$$;

-- Create helper function to check if user owns a character
CREATE OR REPLACE FUNCTION public.owns_character(_character_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.characters
    WHERE id = _character_id AND user_id = _user_id
  );
$$;

-- Create helper function to get campaign_id from document
CREATE OR REPLACE FUNCTION public.get_document_campaign_id(_document_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT campaign_id FROM public.campaign_documents WHERE id = _document_id LIMIT 1;
$$;

-- Recreate policies for campaign_documents using helper functions
CREATE POLICY "Masters can manage their campaign documents"
ON public.campaign_documents
FOR ALL
USING (public.is_campaign_master(campaign_id, auth.uid()));

CREATE POLICY "Players can view delivered documents"
ON public.campaign_documents
FOR SELECT
USING (public.has_document_access(id, auth.uid()));

-- Recreate policies for campaign_document_deliveries using helper functions
CREATE POLICY "Masters can manage deliveries"
ON public.campaign_document_deliveries
FOR ALL
USING (public.is_campaign_master(public.get_document_campaign_id(document_id), auth.uid()));

CREATE POLICY "Players can view own deliveries"
ON public.campaign_document_deliveries
FOR SELECT
USING (public.owns_character(character_id, auth.uid()));

CREATE POLICY "Players can update own deliveries"
ON public.campaign_document_deliveries
FOR UPDATE
USING (public.owns_character(character_id, auth.uid()));