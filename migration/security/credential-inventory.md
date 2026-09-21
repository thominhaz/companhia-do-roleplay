# Inventário de configuração

Somente nomes; valores não pertencem ao repositório.

| Nome atual | Finalidade | Ação no destino |
|---|---|---|
| `DIGITALOCEAN_AI_API_KEY` | geração por IA | criar/rotacionar |
| `DIGITALOCEAN_AI_ENDPOINT` | endpoint IA | configurar |
| `DIGITALOCEAN_AI_MODEL` | modelo IA | configurar |
| `DISCORD_BOT_TOKEN` | bot Discord | rotacionar |
| `DISCORD_CLIENT_ID` | aplicação OAuth Discord | parametrizar |
| `DISCORD_CLIENT_SECRET` | OAuth Discord | rotacionar e trocar callback |
| `DISCORD_GUILD_ID` e IDs de cargos | servidor/cargos Discord | retirar valores fixos do código |
| `APP_PUBLIC_URL` | retorno após OAuth | apontar ao domínio novo |
| `RESEND_API_KEY` | e-mail | rotacionar |
| `STRIPE_SECRET_KEY` | pagamentos | rotacionar e revisar webhooks |
| `LOVABLE_API_KEY` | serviço da plataforma | remover/substituir |
| `SUPABASE_*` | plataforma atual | remover após troca pelo novo backend |

O anon/publishable key atual é público por natureza, mas não deve orientar a arquitetura nova. Credenciais administrativas nunca vão ao navegador.

O código auditado não contém fluxo ativo de pagamento; `useSubscription` concede acesso completo. Antes de portar Stripe, confirme se a integração será reativada.
