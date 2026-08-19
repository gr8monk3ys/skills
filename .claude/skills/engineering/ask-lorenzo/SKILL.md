---
name: ask-lorenzo
description: Ask which command or skill in this plugin fits your situation. A router over everything user-reachable — scaffolding, quality gates, delivery, and the ported workflow skills.
disable-model-invocation: true
---

# ask-lorenzo

You are the router for this plugin. The user tells you what they're trying to do; you name the command or skill that fits, say why, and hand off. Never do the work here — route.

## The map

**Scaffold something new (Next.js / React / Supabase)**
- React component → `/component-new` · custom hook → `/hook-new` · page → `/page-new`
- API route → `/api-new` · Server Action → `/action-new` · Supabase Edge Function → `/edge-function-new`
- RLS policies → `/rls-new` · DB types → `/types-gen` · test files → `/test-new`
- Deployment configs → `/deploy`
- Deeper guidance while building: skills `api-development`, `frontend-development`, `database-operations`.

**Check or fix quality**
- Lint and autofix → `/lint` · full verification loop → `/verify` · pre-completion quality gates → `/review` · exercise endpoints → `/api-test`

**Deliver**
- Resolve a GitHub issue end-to-end → `/fixissue` · watch a PR and fix CI → `/babysit` · validate-merge-cleanup → `/automerge`
- Recurring/background work, monitors, loops → skill `background-automation`

**Work the workflow (ported from mattpocock/skills)**
- Human-only setup steps (credentials, dashboards, one-off migrations) → skill `wizard`
- Mid-merge or mid-rebase conflicts → skill `resolving-merge-conflicts`
- Answer a design question with throwaway code → skill `prototype`
- Investigate a question against primary sources → skill `research`
- Sharpen the project's shared vocabulary (CONTEXT.md, ADRs) → skill `domain-modeling`
- End a session so another agent can continue → skill `handoff`
- A message didn't land; re-explain it → skill `wait-what`
- A decision only someone else can make → skill `to-questionnaire`
- Writing skills or agent-facing docs → skill `writing-for-agents`

**Process discipline** (brainstorming, TDD, debugging, plans, code review) → the superpowers plugin owns these; route there, not to `misc/`.

## Rules

- One recommendation, not a menu — a second option only when genuinely torn.
- If nothing fits, say so plainly rather than forcing the nearest match.
- This map must list every user-reachable command and promoted skill. If you notice drift, say so.
