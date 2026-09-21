# Exportação de dados sem usuários

O dump bruto deve ser solicitado em **Cloud → Advanced settings → Export data** e processado localmente em ambiente controlado. Ele nunca entra no Git.

## Definição adotada

“Sem usuários” significa:

- nenhum registro de conta, senha, sessão, identidade OAuth ou e-mail;
- nenhum UUID real de usuário;
- relações operacionais preservadas por UUID pseudônimo determinístico;
- segredos armazenados em colunas removidos;
- conteúdo livre sujeito a revisão de privacidade.

## Fluxo

1. Restaurar o dump bruto da origem em uma instância temporária, isolada e criptografada, somente para extração.
2. Preparar outro banco de staging com `postgres-bootstrap.sql` e o schema público, sem carregar o schema `auth` da origem.
3. Carregar no staging apenas os dados públicos, com constraints desativadas durante a carga controlada.
4. Definir `go20.pseudonym_salt` com um segredo aleatório mantido fora do Git.
5. Executar `anonymize.sql` no staging.
6. Executar `validate-import.sql`; todas as verificações críticas devem zerar.
7. Gerar dump somente do staging sanitizado.
8. Destruir os bancos temporários, dump bruto e salt após validação, salvo obrigação formal de retenção.

O script é deliberadamente destrutivo e recusa execução sem a configuração de salt.
