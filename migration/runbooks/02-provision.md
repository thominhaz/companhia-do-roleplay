# 02 — Provisionar o destino

1. PostgreSQL 15+ com TLS, backups e usuário administrador separado.
2. Execute `database/postgres-bootstrap.sql`.
3. Execute `database/current-schema.sql`, resolvendo itens anotados em `portability-notes.md`.
4. Provisione OIDC/auth, API, S3 compatível, WebSocket/pub-sub e workers.
5. Cadastre credenciais novas no gerenciador de segredos.
6. Bloqueie acesso público ao banco; somente API, jobs e administração autorizada conectam.
