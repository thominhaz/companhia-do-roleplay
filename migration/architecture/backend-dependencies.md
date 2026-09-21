# Dependências do backend

## Uso direto pelo frontend

- Login por e-mail/senha e Google, recuperação e sessão persistente.
- CRUD nas tabelas públicas por uma API de dados.
- Upload e URL pública de avatares, imagens de campanha, selos e submissões.
- Canais em tempo real para combate, chat, reações, presença/digitação, sessões, trocas e notificações.
- Invocação das funções de Discord, Foundry, e-mail e geradores.

## Impacto da saída da plataforma

Trocar somente a URL do banco não funciona. O pacote cliente atual depende do SDK `@supabase/supabase-js`. A reconstrução deve criar uma camada de API e adaptar os hooks gradualmente, preservando seus contratos de dados e as chaves de cache do React Query.

## Estratégia de transição

1. Criar um cliente de API central com sessão OIDC.
2. Reimplementar consultas por domínio sem alterar telas.
3. Reimplementar mutações e uploads.
4. Reimplementar canais em tempo real.
5. Migrar funções HTTP.
6. Remover o SDK antigo somente após testes de paridade.

## Regras críticas

- Papéis ficam em `user_roles`, nunca em perfil ou storage do navegador.
- Acesso administrativo deve ser validado pelo servidor.
- O mestre acessa dados da própria campanha; jogadores acessam apenas campanhas das quais participam.
- Chaves Foundry e webhooks Discord são segredos de campanha e não devem voltar em consultas gerais.
