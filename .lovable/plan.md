

# Revisão do Sistema de Compartilhamento de Homebrew

## Análise Atual

Estudei todos os arquivos envolvidos: hooks, sheets, RLS policies e tabelas. Identifiquei os seguintes problemas:

### Problemas Encontrados

**1. RLS de `homebrew_shares` bloqueia compartilhamento via aprovação do mestre**
A política INSERT de `homebrew_shares` exige: `is_homebrew_owner(content_id, auth.uid()) AND is_campaign_master(campaign_id, auth.uid())`. Quando o mestre aprova uma solicitação de jogador, o mestre NÃO é o dono do conteúdo. Isso causa falha silenciosa no `useRespondToShareRequest` ao tentar inserir em `homebrew_shares` após aprovar.

**2. RLS de `homebrew_shares` bloqueia compartilhamento direto de jogador (política "enabled")**
Quando a campanha tem `homebrew_sharing_policy = 'enabled'`, o `PlayerShareHomebrewSheet` chama `shareWithCampaign` direto. Mas a RLS INSERT exige `is_campaign_master`, então jogadores nunca conseguem inserir diretamente, mesmo com a política liberada.

**3. Falta SELECT policy para o mestre ver solicitações no `homebrew_share_requests`**
A política SELECT atual é apenas `is_campaign_member`, que verifica a tabela `campaign_players`. O mestre não está em `campaign_players` (ele é `master_id` na tabela `campaigns`), então o mestre pode não ver as solicitações pendentes.

### Problemas Menores
- `handleShare` no `PlayerShareHomebrewSheet` não aguarda resultado (fire-and-forget) e faz `setProcessingCampaignId(null)` imediatamente no `finally`.
- Query cache keys inconsistentes entre `ShareHomebrewSheet` e `PlayerShareHomebrewSheet`.

---

## Plano de Correção

### Etapa 1 — Corrigir RLS de `homebrew_shares` (migração SQL)

Adicionar nova política INSERT que permite:
- O mestre da campanha inserir compartilhamentos (para aprovar solicitações de jogadores)
- Jogadores premium inserirem quando a política da campanha é "enabled"

```sql
-- Dropar política INSERT restritiva atual
DROP POLICY "Owners can share to their campaigns" ON public.homebrew_shares;

-- Nova: Mestre pode compartilhar próprio conteúdo OU aprovar de outros
CREATE POLICY "Masters can share to their campaigns"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_campaign_master(campaign_id, auth.uid())
);

-- Nova: Jogadores premium podem compartilhar direto quando política = 'enabled'
CREATE POLICY "Players can share when policy enabled"
ON public.homebrew_shares FOR INSERT
WITH CHECK (
  is_homebrew_owner(content_id, auth.uid())
  AND is_premium(auth.uid())
  AND can_share_homebrew_in_campaign(campaign_id, auth.uid())
);
```

### Etapa 2 — Corrigir RLS de `homebrew_share_requests` (SELECT para mestre)

Adicionar política que permite o mestre ver solicitações:

```sql
-- Adicionar acesso do mestre
CREATE POLICY "Masters can view campaign share requests"
ON public.homebrew_share_requests FOR SELECT
USING (is_campaign_master(campaign_id, auth.uid()));
```

### Etapa 3 — Corrigir lógica no `PlayerShareHomebrewSheet.tsx`

- Usar `mutateAsync` em vez de `mutate` para aguardar resultado antes de limpar estado.
- Invalidar queries após sucesso para atualizar status visual.

### Etapa 4 — Corrigir `useRespondToShareRequest` (aprovação)

- Após aprovar, invalidar também `['homebrew-share-status']` para atualizar o status no sheet do jogador.

### Etapa 5 — Invalidação de cache consistente

- Alinhar todas as invalidações de query para usar as mesmas keys (`homebrew-shares`, `campaign-homebrew`, `homebrew-share-status`, `homebrew-share-requests`).

---

## Resumo de Arquivos Modificados

| Arquivo | Mudança |
|---|---|
| Migração SQL | Fix RLS `homebrew_shares` (INSERT) e `homebrew_share_requests` (SELECT) |
| `src/components/homebrew/PlayerShareHomebrewSheet.tsx` | Usar `mutateAsync`, invalidar queries |
| `src/hooks/useHomebrewShareRequests.tsx` | Invalidar mais query keys na aprovação/rejeição |
| `src/hooks/useHomebrew.tsx` | Invalidar `campaign-homebrew` e `homebrew-share-status` no share/unshare |

