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
the agent to load this skill; between 5 and 8 it only suggests it.

Prose alone rarely gets there. "Add an endpoint" scores 6, which is a
suggestion; naming the file it goes in, "add an endpoint to
`app/api/users/route.ts`", scores 30, because the path matches a directory rule,
a filename pattern, and two keywords at once. This is the general shape of the
scoring, and the reason to type `/api-development` explicitly for work the
words won't carry: a rename, a refactor across handlers, a review pass over
routes you never described in prose at all.

## What it makes the agent good at

The bar it applies to a route handler:

| Concern | The default it enforces |
| --- | --- |
| Input | A Zod schema at the route entry point, before anything else runs |
| Output | `{ data, success: true, meta? }` on success, `{ error, details?, success: false }` on failure |
| Types | Request and response typed; `any` is not available |
| Auth | JWT or session via middleware, RBAC where roles exist, API keys for machine callers |
| Rate limiting | Upstash Redis, sliding or fixed window, keyed by IP or user, degrading gracefully |
| Tests | Route unit tests with mocked externals, covering the edge cases |

## The response shape is the one that compounds

Most of that table is ordinary good practice, applied consistently. One entry is
different in kind, and it's the one to argue about if you're going to argue
about any of them.

An API's error format is a contract with every caller at once. Handlers that
each invent their own — a string here, `{ message }` there, a bare status code
somewhere else — don't cost anything at the moment they're written. The cost
lands in the client, where handling a failure means knowing which endpoint
produced it, and it lands again in every new client after that. By the time it
hurts, the shape is load-bearing in a dozen places and nobody can change it.

Fixing the envelope up front makes the failure path writable once: a single
function that turns any error response into something the UI can show, and
error codes stable enough for a caller to branch on without parsing prose. The
`details` field is where per-route specificity goes — usually the Zod issues
from the validation that rejected the request — so a route can be specific
without inventing a new envelope to be specific in.

That is also why validation sits at the entry point rather than a few lines
into the handler. Everything past the schema can assume its input is the type it
claims to be, which is what keeps the handler body free of defensive checks and
`any`.

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

**Which response format actually wins?**

One shape, everywhere: `{ data, success: true }` and
`{ error, details?, success: false }`. It is what `/api-new` and `/action-new`
generate, what `CLAUDE.md` and `.claude/rules/PROJECT-RULES.md` require, and what
this skill now applies to routes you write by hand. The skill used to specify a
nested `{ error: { code, message } }` instead, which meant a generated route and
a hand-written one could disagree inside the same codebase; that was a defect and
is fixed. If you are working in an existing codebase that uses something else,
match the codebase — the value is one contract, not this particular one.

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

- The client handles a failure from any endpoint with one function, and adding
  an endpoint doesn't require touching it.
- A malformed request comes back saying which field was wrong, without anyone
  having written that message by hand.
- Changing the shape of a request means editing one schema, and the type errors
  that follow lead you to every line that needed updating.
- You can answer "which routes are authenticated?" by reading the middleware,
  rather than by opening every handler.
- Handler bodies are short, because the defensive checks that would pad them are
  already covered by the schema above.
- The tests that exist are the ones for cases you'd otherwise have to reproduce
  by hand in a client.
