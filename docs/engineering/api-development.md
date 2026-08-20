# api-development

## What it does

`api-development` is the standard the agent holds itself to whenever it writes
a Next.js App Router endpoint — validation at the boundary, one response shape,
typed all the way through, and a considered answer on auth and rate limiting
rather than a default of neither.

It is a standards layer, not a generator. `/api-new` produces the file; this
skill decides what belongs in it, and keeps deciding for every handler you edit
afterwards, including the ones no command scaffolded.

## When to reach for it

It activates on its own. A `UserPromptSubmit` hook scores your prompt against
`hooks/skill-rules.json` — keywords, regex patterns, file paths, directories,
and intent phrasings, each weighted — and at a confidence of 8 or more it tells
the agent to load this skill; between 5 and 8 it suggests it. Mentioning
`app/api/route.ts`, or asking for an endpoint, clears the bar without you doing
anything.

You can still type `/api-development` when the scoring misses — a rename, a
refactor across handlers, a review pass on routes you didn't just describe in
words the hook recognises.

## What it makes the agent good at

The bar it applies to a route handler:

| Concern | The default it enforces |
| --- | --- |
| Input | A Zod schema at the route entry point, before anything else runs |
| Output | `{ data, meta? }` on success, `{ error: { code, message, details? } }` on failure |
| Types | Request and response typed; `any` is not available |
| Auth | JWT or session via middleware, RBAC where roles exist, API keys for machine callers |
| Rate limiting | Upstash Redis, sliding or fixed window, keyed by IP or user, degrading gracefully |
| Tests | Route unit tests with mocked externals, covering the edge cases |

The response format is the part worth internalising, because it is the one that
compounds. Two handlers that disagree about their error shape force every caller
to special-case, and the cost shows up in the client months later — so the skill
treats the shape as fixed rather than per-route taste.

## Commands it pairs with

- [`/api-new`](../../commands/api-new.md) — scaffolds the route this skill then
  governs.
- [`/action-new`](../../commands/action-new.md) — the Server Action equivalent,
  same validation and result contract.
- [`/edge-function-new`](../../commands/edge-function-new.md) — Supabase Edge
  Functions, where the Edge Runtime constraints bite.
- [`/api-test`](../../commands/api-test.md) — exercises the endpoints once they
  exist.

Data access below the handler is [database-operations](./database-operations.md);
the client calling it is [frontend-development](./frontend-development.md).

## Common questions

**I never asked for this skill — why is it in play?**

Because the prompt hook scored your request above its activation threshold. It
is meant to be invisible: the point of an auto-activated standards skill is that
the tenth endpoint is written to the same rules as the first, without you
remembering to ask.

**I'm not on Next.js App Router — is any of it useful?**

Partly. The validate-at-the-boundary rule and the single response shape are
framework-agnostic and worth keeping. The route file layout, Edge Runtime
notes, and the named integrations — Supabase, NextAuth, Upstash — assume this
plugin's stack and will be wrong elsewhere.

**Does it add auth and rate limiting to everything?**

No — it makes them a decision instead of an omission. The failure it targets is
the endpoint that shipped with neither because nobody thought about it, not the
public route that deliberately has neither.

## It's working if

- Every handler validates its input with Zod before touching a database or an
  external service.
- Success and failure come back in the same shape from every route in the
  codebase, and error codes are stable enough to switch on.
- No handler contains `any`.
- Protected routes are protected at the middleware layer, not by a check
  copy-pasted into each handler.
- New endpoints arrive with tests that cover a failure case, not only the happy
  path.
