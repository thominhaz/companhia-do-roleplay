-- Allow new whiteboard storage format (tldraw snapshots)
ALTER TABLE public.campaign_whiteboard_elements
  DROP CONSTRAINT IF EXISTS campaign_whiteboard_elements_element_type_check;

ALTER TABLE public.campaign_whiteboard_elements
  ADD CONSTRAINT campaign_whiteboard_elements_element_type_check
  CHECK (
    element_type = ANY (
      ARRAY[
        'sticky_note'::text,
        'text'::text,
        'image'::text,
        'connection'::text,
        'tldraw_snapshot'::text
      ]
    )
  );
