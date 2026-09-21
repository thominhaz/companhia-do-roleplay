# API de aplicação

## Princípios

- API server-side entre navegador e PostgreSQL.
- Pool de conexões com papel restrito; papel de manutenção separado.
- Validação de entrada por schema, limite de payload e rate limiting.
- Transações para operações compostas como trocas, assinatura e resgate.
- Logs sem corpo sensível, tokens, webhooks ou chaves Foundry.

## Migração incremental

Mapear cada chamada `.from(...).select/insert/update/delete/rpc` dos hooks para endpoints de domínio. Manter nomes e formas dos objetos enquanto o frontend é migrado. Não criar uma API genérica que exponha qualquer tabela ou filtro arbitrário.
