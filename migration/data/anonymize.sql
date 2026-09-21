-- DESTRUCTIVE: run only on a fresh, isolated PostgreSQL destination/staging DB.
-- Load public source data with constraints temporarily disabled, but DO NOT load
-- any source auth schema data. Run postgres-bootstrap.sql first.
-- Required: SET go20.pseudonym_salt = '<secret-held-outside-git>';
BEGIN;

DO $$
BEGIN
  IF current_setting('go20.pseudonym_salt', true) IS NULL
     OR length(current_setting('go20.pseudonym_salt', true)) < 32 THEN
    RAISE EXCEPTION 'Set go20.pseudonym_salt to an external secret of at least 32 characters';
  END IF;
END $$;

CREATE TEMP TABLE user_map (
  original_id uuid PRIMARY KEY,
  pseudo_id uuid NOT NULL UNIQUE
) ON COMMIT DROP;

INSERT INTO user_map (original_id, pseudo_id)
SELECT original_id,
       uuid_generate_v5('ecfbbc4a-b505-4ef1-a5cf-7a55c8a81c1b'::uuid,
                        current_setting('go20.pseudonym_salt') || ':' || original_id::text)
FROM (
  SELECT id original_id FROM auth.users
  UNION SELECT id FROM profiles
  UNION SELECT master_id FROM campaigns
  UNION SELECT user_id FROM characters
  UNION SELECT user_id FROM campaign_players
  UNION SELECT user_id FROM campaign_notes
  UNION SELECT created_by FROM campaign_documents
  UNION SELECT created_by FROM campaign_faction_events
  UNION SELECT created_by FROM campaign_timeline_events
  UNION SELECT user_id FROM homebrew_content
  UNION SELECT user_id FROM character_history
  UNION SELECT requester_id FROM homebrew_share_requests
  UNION SELECT responded_by FROM homebrew_share_requests
  UNION SELECT created_by FROM registration_codes
  UNION SELECT seller_user_id FROM shop_transactions
  UNION SELECT buyer_user_id FROM shop_transactions
) ids
WHERE original_id IS NOT NULL;

-- Remove ephemeral, personal, financial, authentication and free-form communication data.
TRUNCATE TABLE discord_oauth_states, notification_preferences, notifications,
  personal_notes, campaign_message_reactions, campaign_message_read_receipts,
  campaign_messages, player_trades, session_attendance, subscriptions,
  token_redemptions, bug_comments, bugs, supporter_submissions, user_roles
  RESTART IDENTITY CASCADE;

-- Disable FK triggers only inside this controlled transformation. The final
-- validation runs with normal enforcement restored.
SET LOCAL session_replication_role = replica;

-- Profiles become non-identifying identity records.
UPDATE profiles p
SET id = m.pseudo_id,
    display_name = 'Usuário migrado',
    avatar_url = NULL,
    discord_user_id = NULL
FROM user_map m WHERE p.id = m.original_id;

-- Operational ownership references.
UPDATE campaigns t SET master_id=m.pseudo_id, discord_webhook_url=NULL, foundry_api_key=NULL FROM user_map m WHERE t.master_id=m.original_id;
UPDATE characters t SET user_id=m.pseudo_id, image_url=NULL FROM user_map m WHERE t.user_id=m.original_id;
UPDATE campaign_players t SET user_id=m.pseudo_id FROM user_map m WHERE t.user_id=m.original_id;
UPDATE campaign_notes t SET user_id=m.pseudo_id FROM user_map m WHERE t.user_id=m.original_id;
UPDATE campaign_documents t SET created_by=m.pseudo_id FROM user_map m WHERE t.created_by=m.original_id;
UPDATE campaign_faction_events t SET created_by=m.pseudo_id FROM user_map m WHERE t.created_by=m.original_id;
UPDATE campaign_timeline_events t SET created_by=m.pseudo_id FROM user_map m WHERE t.created_by=m.original_id;
UPDATE homebrew_content t SET user_id=m.pseudo_id FROM user_map m WHERE t.user_id=m.original_id;
UPDATE character_history t SET user_id=m.pseudo_id FROM user_map m WHERE t.user_id=m.original_id;
UPDATE registration_codes t SET created_by=m.pseudo_id FROM user_map m WHERE t.created_by=m.original_id;
UPDATE homebrew_share_requests t SET requester_id=m.pseudo_id FROM user_map m WHERE t.requester_id=m.original_id;
UPDATE homebrew_share_requests t SET responded_by=m.pseudo_id FROM user_map m WHERE t.responded_by=m.original_id;
UPDATE shop_transactions t SET seller_user_id=m.pseudo_id FROM user_map m WHERE t.seller_user_id=m.original_id;
UPDATE shop_transactions t SET buyer_user_id=m.pseudo_id FROM user_map m WHERE t.buyer_user_id=m.original_id;

-- External supporter identity is generalized even in published showcase records.
UPDATE catarse_supporters
SET name = 'Apoiador anônimo', message = NULL;
UPDATE supporter_npcs
SET creator_name = 'Apoiador anônimo', creator_message = NULL;
UPDATE supporter_items
SET creator_name = 'Apoiador anônimo', creator_message = NULL;

-- Create compatibility identity anchors without credentials. The source
-- auth.users table must never have been loaded into this staging database.
INSERT INTO auth.users (id, email, raw_user_meta_data)
SELECT pseudo_id, NULL, '{}'::jsonb FROM user_map;

SET LOCAL session_replication_role = origin;

COMMIT;

-- Mandatory manual review after this script:
-- campaign_notes/content, campaign descriptions, character biography fields,
-- NPC text, documents, homebrew descriptions and combat log details can contain PII.
