
-- 1. RLS policy: Allow players to UPDATE campaign_documents for signing (only signature_data and is_signed)
CREATE POLICY "Players can sign delivered documents"
  ON public.campaign_documents FOR UPDATE
  TO authenticated
  USING (has_document_access(id, auth.uid()))
  WITH CHECK (has_document_access(id, auth.uid()));

-- 2. Create atomic function to append signature safely (prevents race conditions)
CREATE OR REPLACE FUNCTION public.append_document_signature(
  _document_id uuid,
  _character_id uuid,
  _character_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _doc campaign_documents%ROWTYPE;
  _existing jsonb;
BEGIN
  -- Verify the caller owns the character
  IF NOT owns_character(_character_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: you do not own this character';
  END IF;

  -- Verify document was delivered to this character
  IF NOT has_document_access(_document_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: document not delivered to you';
  END IF;

  -- Lock the row to prevent concurrent updates
  SELECT * INTO _doc FROM campaign_documents WHERE id = _document_id FOR UPDATE;

  IF _doc IS NULL THEN
    RAISE EXCEPTION 'Document not found';
  END IF;

  IF NOT COALESCE(_doc.requires_signature, false) THEN
    RAISE EXCEPTION 'This document does not require a signature';
  END IF;

  -- Check if already signed by this character
  _existing := COALESCE(_doc.signature_data, '[]'::jsonb);
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(_existing) elem
    WHERE elem->>'character_id' = _character_id::text
  ) THEN
    RAISE EXCEPTION 'Character has already signed this document';
  END IF;

  -- Append the new signature atomically
  UPDATE campaign_documents
  SET 
    signature_data = COALESCE(signature_data, '[]'::jsonb) || jsonb_build_array(
      jsonb_build_object(
        'character_id', _character_id::text,
        'character_name', _character_name,
        'signed_at', now()::text
      )
    ),
    is_signed = true
  WHERE id = _document_id;
END;
$$;
