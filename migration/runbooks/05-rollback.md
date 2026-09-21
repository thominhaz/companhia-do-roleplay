# 05 — Rollback

Acione rollback se houver perda de integridade, falha de autorização entre usuários/campanhas, indisponibilidade prolongada ou divergência de dados.

1. Bloqueie novas escritas no destino.
2. Preserve logs e snapshot para diagnóstico, sem expor conteúdo sensível.
3. Retorne DNS/frontend à origem somente leitura ou ao estado anterior acordado.
4. Reconcilie apenas operações confirmadas após o ponto de corte.
5. Corrija e repita uma restauração limpa; não reutilize staging possivelmente contaminado.
