

# Plano: Revisao e Melhoria do Painel do Mestre

## Fase 1 — Correcoes de Bugs (Prioridade Alta)

### 1.1 Overview: Stats com dados reais
**Arquivo**: `DashboardOverview.tsx` (L95-104)
- Substituir os placeholders "-" por queries reais:
  - **Combates**: contar registros da tabela `combat_encounters` para a campanha
  - **Notas**: contar registros de `campaign_notes` para a campanha
- Passar os contadores como props ou usar hooks diretos no componente

### 1.2 Compendio: Remover aba "Apoiadores"
**Arquivo**: `DashboardCompendium.tsx`
- A aba "Apoiadores" com `SupporterGallery` nao pertence ao contexto de campanha — e conteudo global da plataforma
- Remover as tabs e manter apenas o conteudo de compendio homebrew diretamente
- Simplificar para um unico layout sem tab wrapper

### 1.3 Combate: Remover botao duplicado
**Arquivo**: `DashboardCombat.tsx`
- O botao "Abrir Tracker" aparece no header E dentro do card central (dois CTAs identicos)
- Manter apenas o botao no header e transformar o card em conteudo informativo/status do ultimo combate

## Fase 2 — Melhorias de UX (Prioridade Media)

### 2.1 Notas: Sidebar responsiva no mobile
**Arquivo**: `DashboardNotes.tsx` (L118)
- A sidebar usa `w-64` fixo sem colapso automatico em telas pequenas
- No mobile: iniciar com `sidebarOpen = false` usando o hook `useIsMobile()`
- Quando aberta em mobile, renderizar como overlay com backdrop (similar ao nav mobile do CampaignDashboard)

### 2.2 Overview: Mostrar HP dos jogadores
**Arquivo**: `DashboardOverview.tsx`
- Adicionar um card "Status dos Jogadores" abaixo dos stats
- Para cada jogador com `character_id`, exibir: nome, classe, HP atual/maximo em barra de progresso
- Dados ja disponiveis via `players` prop (expandir query para incluir character data)

### 2.3 Overview: Indicador de combate ativo
**Arquivo**: `DashboardOverview.tsx`
- Verificar se existe um combate ativo (status != 'finished') para a campanha
- Se sim, exibir banner destacado "Combate em andamento — Rodada X" com botao para abrir o tracker

### 2.4 DashboardChat: Eliminar wrapper desnecessario
**Arquivo**: `DashboardChat.tsx`
- Componente de 10 linhas que apenas renderiza `PlayerChatSelector`
- Inlinar diretamente no `CampaignDashboard.tsx` ou manter mas adicionar header consistente com as outras secoes

## Fase 3 — Refatoracao (Prioridade Baixa)

### 3.1 Extrair navegacao do CampaignDashboard
**Arquivo**: `CampaignDashboard.tsx` (296 linhas)
- Extrair `navItems` config e `renderNavGroup` para um componente `DashboardNav.tsx`
- Extrair `renderContent` switch para um componente `DashboardContent.tsx`
- Reduzir o arquivo principal para ~100 linhas (layout + state)

### 3.2 Memoizar listas filtradas nos Workshops
**Arquivos**: `WorkshopNPCs.tsx`, `WorkshopShops.tsx`
- Os `filteredNPCs` e `filteredShops` sao recalculados a cada render
- Envolver em `useMemo` com dependencias em `[npcs, searchQuery, statusFilter]` e `[shops, searchQuery]`

### 3.3 Padronizar cores semanticas
**Arquivos**: `WorkshopNPCs.tsx` (L39), `GeneratorTreasure.tsx`
- Substituir `text-gold`, `bg-gold/10` por tokens do tema (`text-warning`, `bg-warning/10`)
- Garantir consistencia visual entre todos os workshops

## Fase 4 — Features Novas (Apos Estabilizacao)

### 4.1 Resumo de atividade recente no Overview
- Card "Atividade Recente" listando as ultimas 5 acoes da campanha (nota criada, sessao agendada, NPC adicionado, etc.)
- Query agregada das tabelas relevantes com `ORDER BY created_at DESC LIMIT 5`

### 4.2 Quick-stats clicaveis
- Os cards de stats no Overview (Jogadores, Sessoes, Combates, Notas) devem navegar para a secao correspondente ao clicar
- Adicionar `cursor-pointer` e `onClick={() => onNavigate('players')}` em cada card

---

## Ordem de Execucao Sugerida

1. **Fase 1** (3 correcoes): Overview stats reais, remover aba Apoiadores do Compendio, eliminar botao duplicado no Combate
2. **Fase 2.1-2.2**: Sidebar responsiva nas Notas, HP dos jogadores no Overview
3. **Fase 2.3-2.4**: Indicador combate ativo, cleanup DashboardChat
4. **Fase 3**: Refatoracao (extrair nav, memoizar, padronizar cores)
5. **Fase 4**: Features novas (atividade recente, stats clicaveis)

