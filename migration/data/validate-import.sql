-- Critical checks: each count should be zero.
SELECT 'auth emails' check_name, count(*) violations FROM auth.users WHERE email IS NOT NULL
UNION ALL SELECT 'profile avatars', count(*) FROM profiles WHERE avatar_url IS NOT NULL
UNION ALL SELECT 'profile discord ids', count(*) FROM profiles WHERE discord_user_id IS NOT NULL
UNION ALL SELECT 'campaign webhooks', count(*) FROM campaigns WHERE discord_webhook_url IS NOT NULL
UNION ALL SELECT 'foundry keys', count(*) FROM campaigns WHERE foundry_api_key IS NOT NULL
UNION ALL SELECT 'supporter submission emails', count(*) FROM supporter_submissions WHERE email IS NOT NULL
UNION ALL SELECT 'oauth states', count(*) FROM discord_oauth_states
UNION ALL SELECT 'messages', count(*) FROM campaign_messages
UNION ALL SELECT 'personal notes', count(*) FROM personal_notes;

-- Orphan checks.
SELECT 'campaign master orphan' check_name, count(*) violations
FROM campaigns c LEFT JOIN auth.users u ON u.id=c.master_id WHERE u.id IS NULL
UNION ALL
SELECT 'character owner orphan', count(*)
FROM characters c LEFT JOIN auth.users u ON u.id=c.user_id WHERE u.id IS NULL
UNION ALL
SELECT 'campaign player orphan', count(*)
FROM campaign_players cp LEFT JOIN auth.users u ON u.id=cp.user_id WHERE u.id IS NULL;

-- Text scan is indicative, not proof. Review every hit manually.
SELECT 'possible email in campaign notes' check_name, count(*) violations
FROM campaign_notes WHERE coalesce(title,'') || ' ' || coalesce(content,'') ~* '[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}';
