# Database portability notes

## Installation model

1. Provision PostgreSQL 15 or newer.
2. Run `postgres-bootstrap.sql` as database owner.
3. Review and run `current-schema.sql` in chronological order.
4. Resolve any migration that assumes a managed platform feature before continuing.
5. Import only the sanitized dataset.
6. Run `verify.sql` and `data/validate-import.sql`.

`current-schema.sql` is a byte-preserving concatenation of the 98 migration files, with boundary comments. The original files in `supabase/migrations/` remain authoritative.

The compatibility bootstrap creates a publication named `supabase_realtime` solely so the historical `ALTER PUBLICATION` statements apply cleanly. The destination realtime service may consume that publication or replace it with an outbox/CDC design.

## Compatibility layer

The current rules call `auth.uid()` and reference `auth.users`. The bootstrap supplies compatible objects:

- `auth.users` is an identity anchor, not a copy of old accounts.
- The new API authenticates a request and sets `request.jwt.claim.sub` inside its database transaction.
- `auth.uid()` reads that value, so existing row policies can remain meaningful during transition.
- Pseudonymous identity anchors must have no email, password, OAuth identity, session or recovery data.

## Platform-specific dependencies

| Current dependency | Plain PostgreSQL replacement |
|---|---|
| Managed Auth | OIDC provider or own auth service; API maps subject to UUID |
| Data REST API | Application API using a restricted database role |
| Row policies | Retain RLS and set request identity transaction-locally |
| Realtime channels | WebSocket service plus PostgreSQL LISTEN/NOTIFY or CDC |
| Storage buckets | S3-compatible object store; DB stores keys/metadata only |
| Remote functions | HTTP workers/services described in `services/edge-functions.md` |
| Service role | Private server-only role; never expose to browser |

## Extensions

Required by the migration history: `plpgsql`, `pgcrypto`, and `uuid-ossp`. `pg_stat_statements` is recommended for observability. `supabase_vault` is platform-specific and must not be required by the destination application.

## Security warning

Do not deploy the compatibility `auth.users` table as a password store. Password hashes and sessions are intentionally absent. New users must be created in the destination identity provider and linked explicitly to imported pseudonymous ownership only when there is a legitimate migration process.
