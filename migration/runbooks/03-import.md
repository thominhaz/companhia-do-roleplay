# 03 — Sanitizar e importar

1. Em staging vazio, aplique bootstrap e schema.
2. Carregue somente dados públicos da extração com `session_replication_role=replica` em sessão administrativa isolada.
3. Configure `go20.pseudonym_salt` fora de scripts e histórico de shell.
4. Execute `data/anonymize.sql`.
5. Revise manualmente textos livres indicados no manifesto.
6. Execute `database/verify.sql` e `data/validate-import.sql`.
7. Gere dump sanitizado e restaure no destino definitivo.
8. Migre apenas arquivos aprovados e atualize suas chaves/URLs.
9. Compare contagens e checksums por tabela/objeto.
