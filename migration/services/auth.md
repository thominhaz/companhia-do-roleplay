# Autenticação e autorização

## Requisito

Adotar provedor OIDC ou serviço próprio maduro. Não migrar hashes de senha, sessões ou identidades antigas. Usuários reais deverão criar/recuperar acesso no novo provedor.

## Integração com RLS

A API valida o token, resolve um UUID interno e executa cada transação com:

```sql
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '<internal-user-uuid>', true);
```

Nunca aceitar esse UUID do corpo da requisição. Ele vem exclusivamente do token validado.

## Papéis

Papéis permanecem em `public.user_roles`. Operações administrativas consultam `has_role` no servidor/banco. Nunca guardar `admin` em perfil, cookie não assinado ou localStorage.
