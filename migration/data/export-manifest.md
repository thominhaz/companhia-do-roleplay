# Manifesto de dados

## Excluir

- `auth.*` real: contas, identidades, sessões e recuperação.
- `discord_oauth_states`.
- `notifications`, `notification_preferences`, `personal_notes`.
- `campaign_messages`, reações e recibos de leitura.
- `player_trades`, `session_attendance`, `subscriptions`, `token_redemptions`, `user_roles`.
- `bugs` e `bug_comments`.
- `supporter_submissions`, especialmente o campo `email`.

## Preservar com pseudonimização

- `campaigns.master_id`; remover `discord_webhook_url` e `foundry_api_key`.
- `characters.user_id`; remover `image_url` quando apontar para avatar pessoal.
- `campaign_players.user_id`.
- autoria de notas, documentos, eventos, timeline, histórico e homebrew.
- solicitações de compartilhamento, sem identidade real.

## Preservar

Catálogos, encontros, combatentes, NPCs, facções, lojas, itens, documentos, mapas, sessões, homebrew e conteúdo de personagem, sujeitos à revisão de texto livre.

## Revisão humana obrigatória

Descrições, notas, biografias, documentos e logs podem conter nomes, e-mails ou identificadores escritos manualmente. Pseudonimização de colunas não remove PII desses textos.
