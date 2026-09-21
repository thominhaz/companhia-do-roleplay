# GO20 — pacote de migração

Este diretório é a especificação de transferência do GO20 para infraestrutura própria. Ele acompanha o código React, migrations, funções remotas, assets e documentação funcional já presentes no repositório.

## Escopo confirmado

- Destino: PostgreSQL próprio.
- Dados: conteúdo operacional preservado sem contas ou identidades reais.
- Entrega: repositório Git privado.
- Segredos e dumps reais: sempre fora do Git.

## Ordem de leitura para outra IA

1. `architecture/system-overview.md`
2. `architecture/backend-dependencies.md`
3. `database/portability-notes.md`
4. `data/README.md` e `data/export-manifest.md`
5. `services/*.md`
6. `security/*.md`
7. `runbooks/01-export.md` até `05-rollback.md`
8. `architecture/feature-acceptance-checklist.md`

## Fontes de verdade

- Interface: `src/`
- Regras e catálogo D&D: `src/data/`
- Histórico do banco: `supabase/migrations/`
- Funções remotas: `supabase/functions/`
- Tipos gerados do banco: `src/integrations/supabase/types.ts`
- Arquivos públicos e módulo Foundry: `public/`
- Arquitetura do personagem: `public/docs/CHARACTER_SYSTEM_ARCHITECTURE.md`
- Builder: `public/docs/CHARACTER_BUILDER_INSTRUCTIONS.md`

## Regra de segurança

Nunca adicionar a este repositório: dump bruto, `.env`, tokens, chaves, senhas, exports de contas, mapa reversível de pseudônimos ou arquivos pessoais. Use o gerenciador de segredos e um canal criptografado separado.
