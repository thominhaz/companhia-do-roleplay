# Funções HTTP atuais

| Função | Autenticação atual | Dependências | Destino |
|---|---|---|---|
| `send-discord-notification` | sessão do usuário | banco, webhook Discord | worker/API autenticada |
| `sync-discord-role` | sessão/servidor | bot Discord, banco | worker protegido |
| `discord-oauth-callback` | callback público + state | segredo OAuth, bot, banco | rota OAuth pública com state/PKCE |
| `send-submission-notification` | pública no config atual | Resend | endpoint com validação e rate limit |
| `generate-treasure` | valida sessão no código | DigitalOcean AI | endpoint autenticado |
| `generate-encounter` | valida sessão no código | DigitalOcean AI | endpoint autenticado |
| `foundry-sync` | chave por campanha | banco | API externa com chave rotacionável/hash |

Os fontes completos estão em `supabase/functions/`. Portar comportamento e testes, não o cliente administrativo atual. Remover CORS `*` onde não for indispensável.
