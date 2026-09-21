# Auditoria: dependências Supabase para migração a infraestrutura própria

Escopo: frontend (`src/`), edge functions (`supabase/functions/`), config (`supabase/config.toml`) e migrations (`supabase/migrations/`). Objetivo: catalogar tudo que precisa de substituto num backend Postgres/API própria.

## 1. Autenticação (`supabase.auth.*`)

Todo o login usa o SDK `@supabase/supabase-js` client-side, com sessão persistida no `localStorage`.

- Cliente: `src/integrations/supabase/client.ts` — cria o client com `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`, `persistSession: true`, `autoRefreshToken: true` e `localStorage`.
- Fluxo principal: `src/hooks/useAuth.tsx` — `signUp`, `signInWithPassword`, `signOut`, `onAuthStateChange`, `getSession` (linhas 23, 32, 42, 52, 66).
- Login/cadastro: `src/pages/Auth.tsx` (linhas 112, 141, 160) — inclui `supabase.rpc('validate_registration_code')` antes de liberar cadastro.
- Reset de senha: `src/pages/ResetPassword.tsx` (linhas 33, 73) — usa `supabase.auth.updateUser` e o fluxo de recovery token via URL (magic link do Supabase Auth).
- Uso de `auth.uid()`/user id em runtime:
  - `src/hooks/usePlayerTrades.tsx` (linhas 84, 134, 197)
  - `src/hooks/useShopTransactions.tsx` (linha 85)
  - `src/components/menu/ProfileEditSheet.tsx` (linha 156)
  - `src/components/character/EditStatsSheet.tsx` (linha 59)
  - `src/components/campaign/dashboard/DocumentFormSheet.tsx` (linha 106)
- Autorização por papel: RPC `has_role` (`supabase.rpc("has_role")`) em `src/pages/Admin.tsx:40`, `src/pages/AdminStretchGoals.tsx:85`, `src/components/screens/MenuScreen.tsx:124`; função definida em `supabase/migrations/20251229130446_d5d73dcf-2a2a-494e-b097-70f433d1f280.sql`.
- RLS: 64 ocorrências de `auth.uid()` nas migrations de `supabase/migrations/`, todas as policies dependem da claim JWT do Supabase Auth (`auth.uid()`, `auth.jwt()`), tabela `user_roles`.

**Mudança necessária:** substituir Supabase Auth por serviço próprio (ex.: Auth API com JWT compatível, ou Keycloak/Auth.js) que:
- emita um JWT com claim `sub` = user id, verificável no Postgres via `current_setting`/`set_config` (padrão usado por PostgREST/Hasura) para manter as policies RLS funcionando com o mínimo de reescrita;
- reimplemente `signUp`, `signInWithPassword`, `signOut`, refresh de token, e o fluxo de recovery de senha (hoje via e-mail do Supabase);
- substitua o armazenamento atual por sessão segura compatível com a nova API; prefira cookie `HttpOnly`, `Secure` e `SameSite` para tokens sensíveis.

## 2. Banco de dados (`supabase.from(...)`, `.rpc(...)`)

Client-side faz acesso direto ao Postgres via PostgREST (biblioteca `@supabase/supabase-js`), sem camada de API própria. Tabelas acessadas diretamente pelo frontend (contagem de ocorrências de `.from('<tabela>')` em `src/`):

| Tabela | Ocorrências | Observação |
|---|---|---|
| characters | 20 | Builder de personagem |
| profiles | 16 | Perfil/Discord link |
| combat_encounters | 14 | |
| supporter_npcs / supporter_items | 13 / 13 | Conteúdo de apoiadores |
| player_trades | 13 | Trocas entre jogadores, realtime |
| combatants | 13 | |
| campaign_players | 12 | |
| campaign_notes | 12 | |
| campaigns | 10 | |
| supporter_submissions | 9 | |
| catarse_supporters | 9 | |
| homebrew_content / homebrew_shares | 8 / 7 | |
| campaign_npcs | 7 | |
| campaign_character_faction_rep | 7 | |
| shop_transactions / campaign_shop_items | 6 / 6 | |
| campaign_messages | 6 | Chat, realtime |
| stretch_goals, sessions, personal_notes, notifications, homebrew_share_requests, campaign_timeline_events | 5 cada | |
| user_roles, registration_codes, campaign_shops, campaign_npc_relationships, campaign_message_reactions, campaign_factions, campaign_faction_events, campaign_documents, campaign_document_deliveries, avatars | 3–4 cada | |
| session_attendance, character_history, campaign_faction_relationships, campaign_faction_npcs | 2–3 cada | |
| combat_logs, campaign_message_read_receipts, campaign_funding | 2 cada | |
| subscriptions, promo_tokens, notification_preferences | 1 cada | |

Total: ~51 tabelas (confirma o inventário de 51 tabelas citado em `.lovable/plan/pacote-de-migração-completa-do-go20-2026-09-21.md`).

Funções Postgres (`RPC`) chamadas do client, todas definidas em `supabase/migrations/`:
- `validate_registration_code` — `src/pages/Auth.tsx:112` — def. `supabase/migrations/20260306194943_cd9f5dca-1572-4977-9671-4db4ad558232.sql:29`
- `has_role` — `src/pages/Admin.tsx:40`, `src/pages/AdminStretchGoals.tsx:85`, `src/components/screens/MenuScreen.tsx:124` — def. `supabase/migrations/20251229130446_d5d73dcf-2a2a-494e-b097-70f433d1f280.sql:17`
- `redeem_promo_token` — `src/components/menu/SubscriptionSheet.tsx:112` — def. `supabase/migrations/20251223175623_0839948c-0fa6-4752-aadf-d12ff1e1e497.sql:2` (versões anteriores em `20251220213212...` e `20251222181521...`)
- `count_user_homebrew` / `can_create_homebrew` — `src/hooks/useHomebrew.tsx:65,81` — def. `supabase/migrations/20251221001351_...sql:50,67` (variante com limite: `20251227132316_...sql:46`)
- `append_document_signature` — `src/hooks/useDocuments.tsx:246` — def. `supabase/migrations/20260311114155_56702ddb-3c9d-407f-8194-36da806c6abb.sql:10`
- `generate_foundry_api_key` — `src/components/campaign/dashboard/DashboardSettings.tsx:75` — def. `supabase/migrations/20260311140510_091d0b11-d16e-4e64-9cfb-58006d6317ec.sql:3` (versão anterior `20260311135523_...sql:4`)
- `create_discord_oauth_state` — `src/components/menu/DiscordLinkSheet.tsx:99` — def. `supabase/migrations/20260304172635_c0a5c772-af74-4ce6-8c19-6ff2331debc2.sql:15`
- `consume_discord_oauth_state` — chamada apenas server-side em `supabase/functions/discord-oauth-callback/index.ts` — def. mesmo arquivo, linha 40
- `get_campaign_webhook_url` — `src/components/campaign/DiscordWebhookConfig.tsx:26` — def. `supabase/migrations/20251224143840_e29c1254-cbb2-4048-ac5b-1b354dc8dae9.sql:6`

**Mudança necessária:** hoje o frontend fala diretamente com PostgREST + RLS (sem backend intermediário). Migrar exige uma das duas rotas:
1. Manter Postgres + PostgREST próprio (self-hosted) e portar as policies RLS tal como estão (trabalho médio, mas mantém o modelo atual "client fala com banco”), ou
2. Construir uma API própria (REST/GraphQL) que replique cada endpoint e mova as regras de RLS para lógica de autorização no servidor (trabalho maior, porém mais fácil de manter fora do ecossistema Supabase).
Qualquer rota exige portar as ~10 funções RPC acima como funções SQL/stored procedures ou endpoints equivalentes.

## 3. Storage (`supabase.storage.from(...)`)

Buckets definidos via migrations (`INSERT INTO storage.buckets`):
- `avatars` — público — `supabase/migrations/20251224125935_defc14c1-3774-4fb8-8787-4e2d49254cf8.sql`
- `campaign-images` — público — `supabase/migrations/20251224132728_869a3108-b042-446b-90f9-6c782d66fcd9.sql` (ajuste de limites em `20260106141616_a42fb311-5fcd-4cdc-a5f1-c005ce6a2730.sql`)
- `supporter-submissions` — público — `supabase/migrations/20251229202820_f62f02c7-f5c2-40f0-ab92-955814781a44.sql`
- `document-seals` — público — `supabase/migrations/20260112120659_2694808e-b096-4b00-b162-5fd4c641db5e.sql`

Uso no frontend (`supabase.storage.from(...)`):
- `src/hooks/useCampaignImageUpload.tsx:53,65` — upload/URL pública de imagens de campanha (`campaign-images`)
- `src/components/menu/ProfileEditSheet.tsx:97,114` — upload de avatar (`avatars`)
- `src/components/character/EditStatsSheet.tsx:69,87` — upload de retrato de personagem
- `src/components/campaign/dashboard/DocumentFormSheet.tsx:115,121` — upload de selos de documento (`document-seals`)
- `src/pages/SupporterSubmission.tsx:145,152` — upload de submissões de apoiadores (`supporter-submissions`)

**Mudança necessária:** substituir por armazenamento próprio compatível com S3 (MinIO, S3 real, etc.), reimplementando upload/URL assinada/URL pública e as policies de acesso por bucket (hoje via RLS de `storage.objects`, presentes nas mesmas migrations acima).

## 4. Realtime (`supabase.channel`, `postgres_changes`, `removeChannel`)

Assinaturas de mudanças em tabelas via websocket do Supabase Realtime:
- `src/components/campaign/CampaignChatSheet.tsx:176,219` — canal de chat
- `src/hooks/useChat.tsx:142,167` — mensagens de campanha (`campaign_messages`)
- `src/hooks/useCombat.tsx:58,107` — estado de combate (`combat_encounters`, `combatants`)
- `src/hooks/useCombatLogs.tsx:49` — logs de combate
- `src/hooks/useCharacterCombat.tsx:52` — combate de personagem
- `src/hooks/useNotifications.tsx:62` — notificações
- `src/hooks/usePlayerTrades.tsx:183` — trocas entre jogadores
- `src/hooks/useSessions.tsx:235` — sessões de jogo
- `src/hooks/useShopTransactions.tsx:179` — transações de loja
- `src/components/campaign/SessionAttendanceCard.tsx:75` — presença em sessão

**Mudança necessária:** não existe equivalente nativo em Postgres puro. É preciso um serviço de pub/sub próprio (ex.: WebSocket server + LISTEN/NOTIFY do Postgres, ou Socket.IO/Ably/Phoenix Channels) reproduzindo o padrão "assinar mudanças por tabela/filtro" hoje feito com `postgres_changes`.

## 5. Edge Functions (`supabase/functions/`)

Todas em Deno, invocadas via `supabase.functions.invoke(...)` do frontend ou por webhook externo (Discord OAuth). Config de JWT em `supabase/config.toml`.

| Função | Arquivo | Verify JWT | Chamada pelo frontend | Segredos usados | Integrações externas |
|---|---|---|---|---|---|
| send-discord-notification | `supabase/functions/send-discord-notification/index.ts` | true | `src/hooks/useDiscordNotification.tsx:49`, `src/components/campaign/DiscordWebhookConfig.tsx:76` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Discord webhook (`campaign.discord_webhook_url`, via `fetch` linha 273) |
| sync-discord-role | `supabase/functions/sync-discord-role/index.ts` | true | `src/components/menu/DiscordLinkSheet.tsx:127,155`, `src/components/menu/SubscriptionSheet.tsx:136` | `DISCORD_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Discord REST API (guild roles) |
| discord-oauth-callback | `supabase/functions/discord-oauth-callback/index.ts` | false (webhook público) | Redirect OAuth do Discord (não chamado via `invoke`; é a `redirect_uri` do app Discord) | `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Discord OAuth token exchange + REST API; redireciona para `https://go20.lovable.app/?discord=linked` (hardcoded) |
| generate-encounter | `supabase/functions/generate-encounter/index.ts` | false (mas exige Bearer + `auth.getClaims`) | `src/components/campaign/dashboard/GeneratorEncounters.tsx:83` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DIGITALOCEAN_AI_ENDPOINT`, `DIGITALOCEAN_AI_API_KEY`, `DIGITALOCEAN_AI_MODEL` | API de IA na DigitalOcean (chat completions) |
| generate-treasure | `supabase/functions/generate-treasure/index.ts` | false (idem) | `src/components/campaign/dashboard/GeneratorTreasure.tsx:80` | idem acima | idem acima |
| send-submission-notification | `supabase/functions/send-submission-notification/index.ts` | false | `src/pages/AdminSupporters.tsx:308,361` | `RESEND_API_KEY` | Resend (envio de e-mail) |
| foundry-sync | `supabase/functions/foundry-sync/index.ts` | (não listada em `config.toml`, expõe API própria por `x-api-key`) | Não é chamada via `supabase.functions.invoke`; é consumida pelo módulo Foundry VTT (`public/foundry-module/scripts/sync-engine.mjs`) e referenciada em `src/hooks/useFoundrySync.tsx` | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Nenhuma externa; autentica por `foundry_api_key` da tabela `campaigns` |

Config de exposição: `supabase/config.toml` (linhas 1–19) define `project_id` e `verify_jwt` por função.

**Mudança necessária:** cada função vira um endpoint HTTP no backend próprio (Node/Deno/Bun), removendo o SDK `@supabase/supabase-js` client de dentro delas e usando o pool de conexão Postgres direto ou a nova camada de API. `discord-oauth-callback` precisa continuar pública (é a redirect_uri cadastrada no app do Discord) e terá que apontar para o novo domínio. `foundry-sync` precisa continuar sendo um endpoint HTTP simples com autenticação por API key de campanha, pois o módulo Foundry (`public/foundry-module/scripts/sync-engine.mjs`) faz polling HTTP direto (não usa SDK Supabase, então é o mais fácil de portar sem mudar o cliente Foundry, apenas trocando a URL base).

## 6. APIs externas usadas (fora do Supabase)

| Serviço | Onde | Segredos | Uso |
|---|---|---|---|
| Discord OAuth + REST API | `supabase/functions/discord-oauth-callback/index.ts`, `supabase/functions/sync-discord-role/index.ts`, `supabase/functions/send-discord-notification/index.ts` | `DISCORD_CLIENT_SECRET`, `DISCORD_BOT_TOKEN`; `DISCORD_CLIENT_ID` e `DISCORD_GUILD_ID`/role IDs estão hardcoded no código (não são segredos, mas ficam fixos nas functions) | Login social (link de conta), atribuição de cargo por tier de assinatura, notificações de webhook por campanha |
| Discord Webhooks (por campanha) | `send-discord-notification/index.ts:273`, coluna `discord_webhook_url` em `campaigns`, gerenciado em `src/components/campaign/DiscordWebhookConfig.tsx` | URL de webhook guardada no banco (via RPC `get_campaign_webhook_url`) | Notificações de rolagem de dados, sessões, combate |
| DigitalOcean AI (Gradient / model serving) | `supabase/functions/generate-encounter/index.ts`, `supabase/functions/generate-treasure/index.ts` | `DIGITALOCEAN_AI_ENDPOINT`, `DIGITALOCEAN_AI_API_KEY`, `DIGITALOCEAN_AI_MODEL` | Geração de encontros e tesouros via LLM (chat/completions) |
| Resend (e-mail transacional) | `supabase/functions/send-submission-notification/index.ts` | `RESEND_API_KEY` | Notificação de aprovação/rejeição de submissões de apoiadores |
| Foundry VTT (módulo cliente, fora do backend) | `public/foundry-module/scripts/sync-engine.mjs`, `src/hooks/useFoundrySync.tsx` | Nenhum segredo do servidor; usa `x-api-key` por campanha (`foundry_api_key`, gerado por `generate_foundry_api_key`) | Sincronização bidirecional de combate/personagens com Foundry VTT self-hosted do mestre |
| Stripe (menção em código, sem integração ativa encontrada) | `src/hooks/useSubscription.tsx`, `src/hooks/usePlayerTrades.tsx`, `src/lib/currencyUtils.ts` | — | `useSubscription.tsx` está atualmente **hardcoded para retornar acesso completo (`FULL_ACCESS`, tier `mestre`)** — não há chamada real de pagamento no código auditado; os outros dois arquivos usam "payment"/"stripe" apenas como nome de variável de moeda do jogo (ouro/prata/cobre), não integração real. **Confirmar com o proprietário se existia uma integração Stripe removida/desativada antes de assumir que não há nada a portar.**

## 7. Variáveis de ambiente

Frontend (`.env`, lidas via `import.meta.env`, arquivo `src/vite-env.d.ts` e uso em `src/integrations/supabase/client.ts`, `src/hooks/useFoundrySync.tsx`):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Edge functions (`Deno.env.get(...)`, por arquivo):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — usados em quase todas as functions para instanciar o client admin/anon
- `DISCORD_CLIENT_SECRET` — `discord-oauth-callback/index.ts`
- `DISCORD_BOT_TOKEN` — `discord-oauth-callback/index.ts`, `sync-discord-role/index.ts`
- `DIGITALOCEAN_AI_ENDPOINT`, `DIGITALOCEAN_AI_API_KEY`, `DIGITALOCEAN_AI_MODEL` — `generate-encounter/index.ts`, `generate-treasure/index.ts`
- `RESEND_API_KEY` — `send-submission-notification/index.ts`

Valores hardcoded que deveriam virar configuração (não segredos, mas acoplam a function ao ambiente Lovable/Discord atual):
- `discord-oauth-callback/index.ts`: `DISCORD_CLIENT_ID` (linha 4), `DISCORD_GUILD_ID` (linha ~116), mapa `ROLE_IDS`, e a URL de retorno `https://go20.lovable.app` (variável `appUrl`).
- `sync-discord-role/index.ts`: `DISCORD_GUILD_ID`, `ROLE_IDS`.

**Mudança necessária:** criar `.env.example` no novo backend com estas chaves (sem valores), e mover `DISCORD_GUILD_ID`/`ROLE_IDS`/`appUrl` para variáveis de ambiente configuráveis por deploy, já que hoje travam a function ao servidor Discord e domínio específicos.

## 8. Callbacks e webhooks

- **Callback OAuth Discord** (entrada externa → nossa aplicação): `supabase/functions/discord-oauth-callback/index.ts`. É a `redirect_uri` cadastrada no app do Discord Developer Portal (`https://<project>.supabase.co/functions/v1/discord-oauth-callback`, recalculada nas linhas 27–29 a partir de `SUPABASE_URL`). Depois de trocar o token, redireciona (302) para `https://go20.lovable.app/?discord=linked` — hardcoded.
- **Webhook de saída para Discord** (nossa aplicação → Discord): `supabase/functions/send-discord-notification/index.ts:273`, usando `discord_webhook_url` armazenado por campanha.
- **"Webhook" do Foundry** (polling, não é webhook real): `public/foundry-module/scripts/sync-engine.mjs` faz polling HTTP contra `foundry-sync` (GET/POST) com `x-api-key`; há também um `fetch` best-effort de push em `src/hooks/useFoundrySync.tsx:24` para uma URL de Foundry configurada por campanha (`campaign.foundry_vtt_url`), mas é opcional/"fire and forget".
- **Sem cron jobs / `pg_cron` / `pg_net` encontrados** nas migrations (`rg` não retornou nenhuma ocorrência de `cron.schedule`, `pg_net`, `net.http_post`). Não há jobs agendados no backend hoje — qualquer necessidade de agendamento (ex.: lembretes de sessão) precisará ser criada do zero no novo backend.

**Mudança necessária:** reimplementar o endpoint de callback OAuth no novo domínio/servidor e recadastrar a `redirect_uri` no app Discord; parametrizar a URL de retorno pós-login; manter o padrão de webhook de saída (é HTTP simples, portátil).

## 9. Assets estáticos relevantes para a migração

- `public/foundry-module/` — módulo cliente para Foundry VTT (`module.json`, `scripts/sync-engine.mjs`, `lang/`, `styles/`) que fala HTTP com a function `foundry-sync`; precisa apontar para a nova URL de backend após a migração (hoje aponta para a URL configurada pelo usuário em `campaign.foundry_vtt_url`/endpoint próprio, não fixa no módulo, mas o backend consumido é o Supabase Functions atual).
- `public/data/magias-referencia.html`, `public/translations/*.json`, `public/docs/*.md` — conteúdo estático servido direto pelo Vite/hospedagem, sem dependência de Supabase; migram sem alteração.
- `src/assets/*`, `public/embed-icons/*`, `public/fonts/*`, `public/lovable-uploads/*` — imagens/fonts embutidas no bundle ou em `public/`, sem dependência de Supabase Storage; migram sem alteração.
- Uploads dinâmicos de usuário (avatares, imagens de campanha, submissões, selos de documento) **não** estão em `public/`; ficam nos buckets do Supabase Storage listados na seção 3 e precisam de migração de dados (download + re-upload) para o storage próprio.

## 10. Resumo das mudanças por camada

| Camada atual (Supabase) | Situação | Substituto em infraestrutura própria |
|---|---|---|
| Auth (`supabase.auth`, RLS `auth.uid()`) | Alto acoplamento, 64 policies dependem disso | Serviço de auth próprio + JWT compatível com RLS, ou migrar autorização para a API |
| PostgREST direto do client (`supabase.from`) | Client fala direto com o banco, ~51 tabelas | Manter PostgREST self-hosted, ou construir API própria (recomendado a médio prazo) |
| RPC/stored procedures | ~10 funções, todas portáveis (SQL puro) | Reaproveitar diretamente em Postgres próprio |
| Storage (4 buckets) | Upload direto do client via SDK | S3/MinIO próprio + reescrever chamadas `supabase.storage.from` |
| Realtime (10 hooks/componentes) | Depende do Supabase Realtime (proprietário) | Servidor WebSocket/pub-sub próprio (maior esforço de reescrita) |
| Edge Functions (7) | Deno Deploy gerenciado pelo Supabase | Node/Deno/Bun rodando em infraestrutura própria, com as mesmas variáveis de ambiente |
| Integrações externas (Discord, DigitalOcean AI, Resend) | Já são HTTP externo, pouco acoplado ao Supabase | Portam sem alteração de lógica, só de local de execução e variáveis de ambiente |
| Cron/webhooks | Não há cron; só há 1 callback OAuth + 1 webhook de saída + 1 endpoint de polling | Recriar callback OAuth e endpoint `foundry-sync` como rotas HTTP no novo backend |

## Pendências para confirmar com o proprietário
- Se houve integração de pagamento (Stripe) ativa em algum momento além do que resta hoje em `useSubscription.tsx` (atualmente todo usuário recebe `FULL_ACCESS` hardcoded).
- Decisão de arquitetura: manter PostgREST self-hosted (menor esforço, mantém padrão atual) vs. construir API própria (maior esforço, mais controle/observabilidade).
- Domínio final do novo backend, para recadastrar a `redirect_uri` do Discord OAuth e o `appUrl` de retorno pós-login.
