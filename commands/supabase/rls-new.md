---
description: Scaffold Supabase Row Level Security policies from a description, with tests
argument-hint: "<table> [access description]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(supabase *)
model: claude-opus-4-8
---

Generate Supabase Row Level Security (RLS) policies for a table, plus tests, from a
plain-language access description.

## Request

$ARGUMENTS

## Process

### 1. Resolve the table

- Identify the target table (`$1`) and confirm its columns. Read existing
  migrations under `supabase/migrations/` or run `supabase db dump --schema public`
  if available. Never invent column names — confirm `user_id`/`owner` ownership
  columns before referencing them.

### 2. Translate the access rules

Map the description into the four operations. Default to **deny-by-default**: enable
RLS, then add only the policies the description justifies.

| Operation | Clause | Typical rule |
| --- | --- | --- |
| SELECT | `USING` | Owner reads own rows; public reads where `is_public` |
| INSERT | `WITH CHECK` | `auth.uid() = user_id` on the new row |
| UPDATE | `USING` + `WITH CHECK` | Owner only; cannot reassign `user_id` |
| DELETE | `USING` | Owner only, or soft-delete via UPDATE |

### 3. Generate the migration

Create `supabase/migrations/<timestamp>_rls_<table>.sql`:

```sql
-- Enable RLS (deny-by-default once enabled)
alter table public.<table> enable row level security;

-- SELECT: owners read their own rows
create policy "<table>_select_own"
  on public.<table> for select
  to authenticated
  using ( (select auth.uid()) = user_id );

-- INSERT: can only insert rows you own
create policy "<table>_insert_own"
  on public.<table> for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

-- UPDATE: owners only; ownership column is immutable
create policy "<table>_update_own"
  on public.<table> for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

-- DELETE: owners only
create policy "<table>_delete_own"
  on public.<table> for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
```

### 4. Performance

- Wrap `auth.uid()` in a scalar subquery — `(select auth.uid())` — so Postgres caches
  it per-statement instead of re-evaluating per row.
- Ensure an index exists on the column used in the policy predicate (usually
  `user_id`). Add `create index if not exists` to the migration when missing.
- Scope every policy to a role (`to authenticated` / `to anon`) so it is skipped for
  irrelevant roles.

### 5. Tests

Generate a pgTAP test under `supabase/tests/<table>_rls_test.sql` that asserts:

- An anonymous request reads zero rows.
- User A cannot read, update, or delete User B's rows.
- A user can insert only rows where `user_id = auth.uid()`.

```sql
begin;
select plan(4);

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"<user-a-uuid>"}', true);

select is_empty(
  $$ select * from public.<table> where user_id = '<user-b-uuid>' $$,
  'User A cannot see User B rows'
);

select * from finish();
rollback;
```

## Output

- The migration SQL file.
- The pgTAP test file.
- A short summary of which operations are allowed for which roles, and any
  ownership/columns assumptions you made.

## Safety

- Always `enable row level security` — a table with policies but RLS disabled is wide
  open.
- Add an explicit policy for every operation you intend to allow; everything else stays
  denied.
- Never grant `to public`/`anon` write access unless the description explicitly asks for
  it, and call it out loudly if so.
