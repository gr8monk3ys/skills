# database-operations

## What it does

`database-operations` is the standard the agent applies to schema, migrations,
queries, and Supabase policies — normalised design with real constraints,
indexes chosen from query patterns, and types generated from the schema rather
than written twice.

Two defaults do most of the work. Row Level Security goes on every table, so
"we'll add policies later" never becomes the state a table ships in. And every
migration is judged by whether it is safe to run against a live table with
traffic on it — adding a nullable column or one with a default is safe, adding
`NOT NULL` without a default is not, and the difference is not a style
preference.

## When to reach for it

It activates on its own. A `UserPromptSubmit` hook scores each prompt against
`hooks/skill-rules.json` and loads the skill when the score clears its
threshold. A path does it comfortably — "update `prisma/schema.prisma`" scores
23 — and so does a clear intent: "add a migration" scores 9. The word
*migration* by itself scores 5, which is a suggestion rather than an
activation, and "add an index" doesn't reach even that.

The gap worth knowing is RLS. Despite being this skill's central rule, *RLS*
appears in none of its keywords, patterns, or intents, so "add an RLS policy to
the posts table in Supabase" scores 4 — below the suggestion threshold, let
alone activation. Type `/database-operations` for policy work, and for anything
else the hook won't score, like reviewing indexes on a schema you haven't named.

## What it makes the agent good at

| Concern | The default it applies |
| --- | --- |
| Schema | 3NF, real data types, foreign keys, check constraints, sensible defaults |
| Indexes | Chosen from the queries that exist, including composite and partial |
| Migrations | Backwards-compatible and zero-downtime shaped, with a rollback in mind |
| Queries | `EXPLAIN ANALYZE` before optimising; N+1 treated as a bug |
| Security | RLS enabled on every table, policies written per operation |
| Types | Generated from the schema; transactions for anything multi-step |

The RLS default deserves the emphasis it gets. In Supabase, a table without RLS
is reachable by anything holding the anon key — so the omission isn't a missing
nicety, it's a public table. Enabling it and writing a policy per operation
(`SELECT` and `INSERT` need separate ones, with `USING` and `WITH CHECK` doing
different jobs) is the baseline the skill starts from.

## Commands it pairs with

- [`/rls-new`](../../commands/rls-new.md) — turns a plain-language access
  description into policies, with tests.
- [`/types-gen`](../../commands/types-gen.md) — regenerates TypeScript types
  from the live schema, which is what keeps "type everything" honest.
- [`/edge-function-new`](../../commands/edge-function-new.md) — Supabase Edge
  Functions that talk to the database.

The handlers reading and writing through this layer are
[api-development](./api-development.md)'s concern.

## Common questions

**Why is it active when I only asked for a query?**

Because the prompt hook scored it above the activation threshold. A query is
usually where the missing index or the N+1 shows up, so this is the moment the
skill is most useful rather than an odd time to appear.

**We use Prisma / Drizzle / raw SQL — does it assume one?**

It covers Prisma and Drizzle patterns and plain PostgreSQL, and assumes Postgres
underneath. The parts you'd carry to a different database — migration safety,
index selection, transaction boundaries — hold anywhere; the Supabase-specific
material, RLS especially, does not.

**Does RLS-on-everything slow things down or get in my way?**

Policies are predicates the planner sees, so they interact with your indexes
like any other filter — which is one more reason the skill picks indexes from
real query patterns. The alternative is enforcing access in application code
only, which holds until something reaches the database by another path.

**Will it run migrations against my database?**

Writing and sequencing them is the skill's job; running them is a decision the
plan is supposed to make explicit — test in staging first, and know what the
rollback is before the forward migration goes anywhere near production.

## It's working if

- Every new table arrives with RLS enabled and at least one policy, in the same
  migration.
- Migrations you'd be willing to run at peak traffic — no unguarded `NOT NULL`,
  no rewrite of a large table hidden inside an innocuous-looking change.
- Indexes trace to a query that actually runs, rather than being sprinkled on
  columns that look important.
- An optimisation is preceded by an `EXPLAIN ANALYZE`, not by a guess.
- Types come from `/types-gen` and not from a hand-written interface that
  drifts.
- Multi-step writes are wrapped in a transaction.
