# Visão geral do sistema

## Aplicação

SPA React 18 + TypeScript + Vite, com React Router e React Query. O cliente atual conversa diretamente com serviços gerenciados para login, banco, arquivos, atualizações em tempo real e funções HTTP.

Rotas principais:

- `/` — aplicação autenticada com abas Home, Personagens, Campanhas, Mapas, Ferramentas e Menu.
- `/auth` e `/reset-password` — acesso e recuperação.
- `/character/:id` — ficha de jogo.
- `/characters/new` e `/characters/:id/builder` — criação, edição e progressão.
- `/grimoire` — grimório.
- `/admin*` — administração, apoiadores e metas.
- `/apoiadores*` — galeria e submissões.

## Domínios

- Personagens: Builder, ficha, magias, inventário, condições, histórico e multiclasse.
- Campanhas: participantes, sessões, notas, NPCs, facções, timeline, mapas e documentos.
- Combate: encontros, combatentes, logs e sincronização Foundry.
- Comunicação: chat público/privado, reações, leitura e notificações.
- Homebrew: conteúdo, compartilhamento e aprovação.
- Economia: lojas, transações e trocas entre jogadores.
- Comunidade: apoiadores, itens/NPCs submetidos, metas e bugs.
- Integrações: Discord, Foundry, e-mail e geração por IA.

## Banco atual

51 tabelas públicas, 6 enums de domínio, funções SQL de autorização/negócio, triggers de timestamps e políticas de linha. Quatro áreas públicas de arquivos: `avatars`, `campaign-images`, `document-seals`, `supporter-submissions`.

## Arquitetura de destino recomendada

```text
Browser React
  -> API HTTPS (autenticação, validação e autorização)
     -> PostgreSQL (RLS como defesa adicional)
     -> S3 compatível (mídia)
     -> WebSocket/pub-sub (tempo real)
     -> workers HTTP (Discord, Foundry, e-mail, IA)
  -> provedor OIDC (login novo)
```

O navegador nunca recebe senha do banco, papel administrativo ou segredo de integração.
