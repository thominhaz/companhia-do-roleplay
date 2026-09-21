-- Run after schema installation. Every query should return zero rows unless noted.

-- Public tables without RLS (review every result; catalog tables may be intentional).
SELECT c.relname AS table_without_rls
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity
ORDER BY c.relname;

-- Foreign keys pointing outside public/auth compatibility schemas.
SELECT conrelid::regclass AS source_table, confrelid::regclass AS target_table,
       pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = 'public'::regnamespace
  AND split_part(confrelid::regclass::text, '.', 1) NOT IN ('public', 'auth')
ORDER BY 1;

-- Policies that still depend on the request identity compatibility function.
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND (coalesce(qual, '') LIKE '%auth.uid()%' OR coalesce(with_check, '') LIKE '%auth.uid()%')
ORDER BY tablename, policyname;

-- Expected identity condition: no real email is present.
SELECT id, email FROM auth.users WHERE email IS NOT NULL;
