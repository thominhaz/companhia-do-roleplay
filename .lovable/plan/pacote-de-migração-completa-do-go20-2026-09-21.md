# Pacote de migração completa do GO20

## Objetivo

Preparar o repositório privado para que outra IA consiga reconstruir o GO20 fora da Lovable, usando Postgres próprio e preservando os dados operacionais sem exportar contas, e-mails, senhas, tokens ou outras credenciais.

O repositório será a fonte de verdade do código e da documentação. O arquivo bruto de dados será exportado separadamente pelo proprietário em **Cloud → Advanced settings → Export data**, pois não deve ser versionado no Git.

## O que será entregue no repositório

### 1. Inventário técnico completo
- Mapa da aplicação React, páginas, fluxos, componentes, arquivos estáticos e fontes.
- Catálogo das 51 tabelas atuais, enums, funções, triggers, índices, constraints, grants e regras de acesso.
- Catálogo das 7 funções remotas, seus endpoints, autenticação e integrações externas.
- Catálogo de login, arquivos, atualizações em tempo real e chamadas ao banco usadas pelo frontend.
- Matriz “recurso atual → substituto fora da Lovable”, destacando o que funciona em Postgres puro e o que exige serviço adicional.

### 2. Banco reproduzível em Postgres próprio
- Consolidar as migrations atuais em um baseline SQL auditável.
- Separar recursos portáveis de dependências específicas da plataforma (`auth`, `storage`, `realtime`, `auth.uid()` e APIs de funções).
- Produzir uma versão compatível com Postgres próprio, com extensões necessárias, enums, tabelas, funções, triggers, índices e permissões.
- Criar uma camada de identidade substituível para preservar relações internas sem depender de `auth.users`.
- Documentar a ordem de instalação, rollback e verificações pós-importação.

### 3. Exportação de dados sem usuários
- Não incluir contas de autenticação, e-mails, hashes de senha, sessões, tokens OAuth ou códigos temporários.
- Pseudonimizar UUIDs de usuário de forma determinística para manter campanhas, personagens, notas, combates, homebrews e demais relações funcionais.
- Excluir ou sanitizar conteúdo pessoal direto, incluindo perfil, e-mail de submissões, URLs de webhook, chaves Foundry e estados OAuth.
- Gerar scripts de transformação para aplicar sobre o dump oficial exportado pelo proprietário.
- Gerar manifesto de tabelas incluídas, excluídas e sanitizadas, com justificativa.
- Gerar validação por contagens, chaves órfãs e checksums antes/depois, sem registrar conteúdo pessoal.

### 4. Arquivos e mídia
- Inventariar os buckets atuais: `avatars`, `campaign-images`, `document-seals` e `supporter-submissions`.
- Criar procedimento de download e reenvio para armazenamento próprio/S3 compatível.
- Gerar manifesto de objetos, caminhos, tamanhos e checksums.
- Remover avatares e anexos pessoais quando não forem necessários; sanitizar referências no banco.
- Documentar a troca de URLs públicas e políticas de acesso.

### 5. Backend e serviços que Postgres sozinho não substitui
- Especificar uma API própria para consultas e mutações hoje feitas diretamente pelo cliente.
- Especificar autenticação, autorização por usuário/campanha e papéis no servidor.
- Especificar WebSocket/pub-sub para chat, combate, presença e notificações em tempo real.
- Portar ou documentar as funções de Discord, Foundry, notificações e geração por IA.
- Preservar o comportamento das regras atuais sem transportar a dependência da Lovable.

### 6. Configuração e credenciais
- Criar `.env.example` somente com nomes, finalidade e obrigatoriedade das variáveis.
- Documentar os segredos atualmente necessários: DigitalOcean AI, Discord, Resend e Stripe, sem seus valores.
- Marcar `LOVABLE_API_KEY` como dependência a remover/substituir, não como credencial a migrar.
- Criar checklist de rotação: as credenciais reais devem ser recriadas ou rotacionadas e cadastradas apenas no gerenciador de segredos do novo ambiente.
- Nenhuma credencial privada, dump bruto ou dado pessoal será commitido.

### 7. Manual para a IA que fará a reconstrução
- Arquitetura atual e fluxos completos por domínio.
- Contratos de dados e endpoints esperados pelo frontend.
- Ordem recomendada de implantação: Postgres → identidade → API → storage → tempo real → funções → frontend.
- Critérios de aceite para login, personagens/Builder, campanhas, notas, sessões, combate, chat, homebrew, comércio, documentos e integrações.
- Lista explícita de incompatibilidades, decisões pendentes e pontos que não podem ser inferidos.

## Estrutura prevista

```text
migration/
├── README.md
├── architecture/
│   ├── system-overview.md
│   ├── frontend-data-contracts.md
│   ├── backend-dependencies.md
│   └── feature-acceptance-checklist.md
├── database/
│   ├── current-schema.sql
│   ├── postgres-baseline.sql
│   ├── portability-notes.md
│   └── verify.sql
├── data/
│   ├── README.md
│   ├── anonymize.sql
│   ├── export-manifest.md
│   └── validate-import.sql
├── storage/
│   ├── README.md
│   └── object-manifest.example.csv
├── services/
│   ├── auth.md
│   ├── api.md
│   ├── realtime.md
│   └── edge-functions.md
├── security/
│   ├── credential-inventory.md
│   ├── rotation-checklist.md
│   └── privacy-checklist.md
└── runbooks/
    ├── 01-export.md
    ├── 02-provision.md
    ├── 03-import.md
    ├── 04-cutover.md
    └── 05-rollback.md
```

## Sequência de execução

1. Auditar o código, migrations e backend atual; fechar o inventário.
2. Gerar o baseline de banco e o relatório de portabilidade.
3. Criar e testar scripts de anonimização e validação em dados sintéticos.
4. Documentar storage, tempo real, autenticação, funções e integrações.
5. Criar `.env.example`, checklist de rotação e proteção do Git.
6. Montar o manual de reconstrução e critérios de aceite.
7. Revisar o pacote para confirmar que não contém segredos nem dados reais.
8. Orientar a conexão do projeto a um repositório Git privado; o proprietário autoriza e cria o repositório pela integração do editor.
9. O proprietário solicita o export oficial de dados, executa a transformação local e entrega o dump anonimizado fora do histórico do Git.

## Limites e decisões de segurança

- Senhas de usuários não serão exportadas ou recuperadas.
- “Sem usuários” será implementado como ausência de identidades reais, mantendo referências por UUIDs pseudônimos para não destruir os dados relacionados.
- O Postgres, isoladamente, não fornece login, API HTTP, armazenamento de arquivos, envio de e-mail nem tempo real; esses serviços serão especificados para implementação no novo ambiente.
- O pacote não concede à outra IA acesso administrativo ao ambiente atual. Ela receberá apenas artefatos revisados e sanitizados.
- O corte definitivo só deve ocorrer após teste de restauração, validação funcional e rotação de todas as credenciais no destino.
