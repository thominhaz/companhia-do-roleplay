# Inventário do schema atual

## Resumo

- 51 tabelas públicas.
- 8 enums: `app_role`, `bug_severity`, `bug_status`, `homebrew_content_type`, `homebrew_sharing_policy`, `homebrew_source`, `notification_type` e `subscription_status`.
- Funções SQL para autorização, assinatura de documentos, convites, assinatura/plano, notificações e manutenção.
- Triggers de `updated_at`, convite de campanha, imutabilidade de trocas e criação de perfil.
- 4 buckets de arquivos.

## Tabelas por domínio

**Personagens:** `characters`, `character_history`, `campaign_character_faction_rep`.

**Campanhas e participantes:** `campaigns`, `campaign_players`, `sessions`, `session_attendance`.

**Notas e comunicação:** `campaign_notes`, `personal_notes`, `campaign_messages`, `campaign_message_reactions`, `campaign_message_read_receipts`, `notifications`, `notification_preferences`.

**Combate e mapas:** `combat_encounters`, `combatants`, `combat_logs`, `battle_maps`, `campaign_whiteboard_elements`.

**Mundo:** `campaign_npcs`, `campaign_npc_relationships`, `campaign_factions`, `campaign_faction_npcs`, `campaign_faction_relationships`, `campaign_faction_events`, `campaign_timeline_events`.

**Documentos:** `campaign_documents`, `campaign_document_deliveries`.

**Economia:** `campaign_shops`, `campaign_shop_items`, `shop_transactions`, `player_trades`.

**Homebrew:** `homebrew_content`, `homebrew_shares`, `homebrew_share_requests`.

**Contas e acesso:** `profiles`, `subscriptions`, `user_roles`, `discord_oauth_states`.

**Promoções e cadastro:** `promo_tokens`, `token_redemptions`, `registration_codes`.

**Comunidade e administração:** `catarse_supporters`, `supporter_items`, `supporter_npcs`, `supporter_submissions`, `stretch_goals`, `campaign_funding`, `bugs`, `bug_comments`.

## Funções SQL

Autorização: `has_role`, `is_campaign_master`, `is_campaign_member`, `owns_character`, `has_homebrew_access`, `is_homebrew_owner`, `has_document_access`, `is_mestre`, `is_premium`.

Negócio: `append_document_signature`, `join_campaign_by_code`, `redeem_promo_token`, `create_notification`, `get_or_create_notification_preferences`, `generate_foundry_api_key`, `create_discord_oauth_state`, `consume_discord_oauth_state`, `validate_registration_code`.

Limites/consulta: `can_create_character`, `can_create_homebrew`, `can_create_homebrew_with_limit`, `count_user_characters`, `count_user_homebrew`, `get_subscription_tier`, `can_share_homebrew_in_campaign`, `get_campaign_webhook_url`, `get_document_campaign_id`.

Infraestrutura: `handle_new_user`, `generate_invite_code`, `set_campaign_invite_code`, `update_updated_at_column`, `prevent_player_trade_immutable_updates`.

As definições completas estão em `current-schema.sql`; não replique este resumo como fonte executável.
