# CLAUDE.md

Project memory for Claude when working in this repository.

## What this is

A Claude Code plugin that scaffolds Next.js + React + Supabase code, distributed via npm (`@gr8monk3ys/claude-code-plugin`) and the Claude Code plugin marketplace. Designed to compose with the [superpowers](https://github.com/obra/superpowers) plugin — superpowers handles process, this plugin handles stack-specific scaffolding.

<!-- AUTOGEN:counts -->
**17 commands** · **6 agents** · **14 skills** · **14 hooks** · **2 monitors**
<!-- /AUTOGEN:counts -->

## Commands

<!-- AUTOGEN:commands -->
| Name | Description |
| --- | --- |
| `/action-new` | Scaffold a Next.js 15 Server Action with Zod validation and typed results |
| `/api-new` | Create a new Next.js API route with validation, error handling, and TypeScript |
| `/api-test` | Test API endpoints with automated test generation |
| `/automerge` | PR automation - validate, merge, cleanup, and sync |
| `/babysit` | Watch a PR in a loop and auto-fix CI failures and review comments |
| `/component-new` | Create a new React component with TypeScript and modern best practices |
| `/deploy` | Generate deployment configurations and workflows |
| `/edge-function-new` | Create a new Supabase Edge Function with Deno |
| `/fixissue` | End-to-end issue resolution - fetch, branch, fix, test, commit, PR, close |
| `/hook-new` | Create custom React hooks with TypeScript and best practices |
| `/lint` | Run linting and fix code quality issues |
| `/page-new` | Create a new Next.js page with App Router best practices |
| `/review` | RIPER Review Phase - Quality gates before considering work complete |
| `/rls-new` | Scaffold Supabase Row Level Security policies from a description, with tests |
| `/test-new` | Generate test files for Jest, Vitest, or Playwright |
| `/types-gen` | Generate TypeScript types from Supabase database schema |
| `/verify` | Run comprehensive 6-phase verification loop (build, types, lint, tests, security, diff) |
<!-- /AUTOGEN:commands -->

## Agents

<!-- AUTOGEN:agents -->
| Name | Description |
| --- | --- |
| `backend-architect` | Design reliable backend systems with focus on data integrity, security, and fault tolerance |
| `build-error-resolver` | Use when fixing TypeScript errors, build failures, compilation issues, type mismatches, or "tsc --noEmit" errors. Activates on build failures, type errors, or compilation problems requiring quick minimal fixes. |
| `code-reviewer` | Use this agent when reviewing code for quality, performing PR reviews, or analyzing code for security vulnerabilities, performance issues, or style problems. Activates on code review requests or quality assessments. |
| `devops-engineer` | Design CI/CD pipelines, infrastructure as code, and deployment strategies for reliable software delivery |
| `frontend-architect` | Create accessible, performant user interfaces with focus on user experience and modern frameworks |
| `test-strategist` | Use this agent when planning test strategies, analyzing test coverage, or designing comprehensive testing approaches. Activates on test planning, coverage analysis, or when asking about what to test. |
<!-- /AUTOGEN:agents -->

## Skills

<!-- AUTOGEN:skills -->
| Name | Description |
| --- | --- |
| `api-development` | WHEN to auto-invoke: Creating API routes, building endpoints, adding route.ts files, implementing REST/GraphQL APIs, adding authentication to APIs, rate limiting, API validation with Zod, handling HTTP methods (GET/POST/PUT/DELETE). |
| `ask-lorenzo` | Ask which command or skill in this plugin fits your situation. A router over everything user-reachable — scaffolding, quality gates, delivery, and the ported workflow skills. |
| `background-automation` | WHEN to auto-invoke: Setting up recurring or self-paced tasks, watching CI or deploys, babysitting pull requests, configuring monitors, running long jobs in the background, scheduling check-ins, polling for a condition, or wiring Claude Code on the web/cloud sessions and PR activity subscriptions. |
| `database-operations` | WHEN to auto-invoke: Database schema design, creating migrations, writing SQL queries, query optimization, Supabase operations, Prisma/Drizzle schema changes, PostgreSQL tasks, RLS policies, indexes. |
| `domain-modeling` | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR. |
| `frontend-development` | WHEN to auto-invoke: Creating UI components, building React/Vue/Svelte components, Next.js pages, styling with Tailwind/CSS, state management setup, form handling, accessibility improvements, client-side interactivity. |
| `handoff` | Compact the current conversation into a handoff document for another agent to pick up. |
| `prototype` | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. |
| `research` | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent. |
| `resolving-merge-conflicts` | Use when you need to resolve an in-progress git merge/rebase conflict. |
| `to-questionnaire` | Turn a decision you can't fully answer into a questionnaire for someone else to fill in. |
| `wait-what` | Stop. That last message did not land — re-pitch it. |
| `wizard` | Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself. |
| `writing-for-agents` | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. |
<!-- /AUTOGEN:skills -->

## Code standards

- TypeScript strict mode, no `any`
- Zod for runtime validation at boundaries
- Error format: `{ data, success: true }` or `{ error, success: false }`
- 2-space indent, single quotes, no semicolons
- Comments only for non-obvious WHY; no commented-out code

## Directory map

**Repo root is what ships to users; `.claude/` is how this repo itself runs.**

```
commands/<name>.md             # Slash commands — FLAT, never nested (see below)
agents/<name>.md               # Subagent personas — FLAT, never nested
skills/<bucket>/<name>/SKILL.md  # engineering|productivity ship; misc|in-progress|deprecated don't
hooks/                         # Lifecycle hooks (.js scripts + hooks.json + skill-rules.json)
.claude-plugin/plugin.json     # Generated — DO NOT hand-edit
.claude/monitors/              # Background watchers (monitors.json) — counted by sync
.claude/scripts/               # Repo-internal helpers (not shipped)
.claude/{settings,rules,memory,profiles,docs}  # This repo's own config
scripts/sync-manifest.js       # Regenerates plugin.json + AUTOGEN blocks
scripts/lib/manifest.js        # Pure helpers used by sync-manifest
tests/manifest-sync.test.js    # node:test unit tests for sync logic
tests/run-all.js               # Integration smoke tests
bin/cli.js                     # `lorenzo-claude` / `lcc` CLI installer
```

## How Claude Code finds these (learned the hard way)

Only **directory-path** entries in `plugin.json` are honoured. `skills` is
declared there as directory paths and works, because bucketed skills sit two
levels deep where convention cannot reach them.

`commands` and `agents` are **not declared at all** — declaring them as file
paths is silently ignored. They are auto-discovered from the repo root, and
that discovery **does not recurse**. A command in a subdirectory is counted by
the sync and listed in the tables below while being invisible to every
installed user. `tests/run-all.js` and CI both fail on a nested file; do not
"organise" these into folders.

## Skill buckets

`engineering/` and `productivity/` are the promoted buckets — exactly these ship in `plugin.json`, the README tables, and `lcc install` (enforced by `scanSkills` in `scripts/lib/manifest.js`, not by convention). `misc/` holds skills that overlap superpowers, kept unshipped on purpose. Promote by moving the folder and running `npm run sync`.

`ask-lorenzo` is the router. When you add, rename, remove, or change the behaviour of a user-reachable command or promoted skill, re-read its SKILL.md and update the map — a router that lies is worse than none.

Every promoted skill also has a docs page at `docs/<bucket>/<skill>.md`, written
for the human choosing whether to reach for it. Adding, renaming, or changing a
promoted skill means creating or re-syncing that page — see
[.agents/writing-docs.md](.agents/writing-docs.md). `npm test` fails when pages
and promoted skills disagree.

`CONTEXT.md` holds this repo's shared vocabulary; use its terms and keep it current (the `domain-modeling` skill maintains it).

## Workflow

- Edit commands/agents/skills as `.md` files; the manifest regenerates automatically (`npm run sync`).
- `npm run sync:check` is wired into pre-commit and CI — drift fails the build.
- See [ROADMAP.md](ROADMAP.md) for upcoming work.
