# Tempo real

Canais atuais cobrem chat, reações, digitação/presença, combate, combatentes, logs, presença em sessão, trocas e notificações.

## Destino

- WebSocket autenticado.
- Autorização por campanha/personagem antes da inscrição.
- Eventos publicados somente após commit.
- Sequência monotônica ou cursor por canal para recuperar perdas.
- PostgreSQL `LISTEN/NOTIFY` é aceitável para sinalização; eventos duráveis exigem outbox/stream.
- O cliente invalida as mesmas chaves do React Query usadas hoje.
