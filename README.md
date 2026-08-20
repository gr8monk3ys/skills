# Lorenzo's Claude Code Plugin

<p align="center">
  <img src="docs/assets/hero.png" alt="lorenzos-claude-code preview" width="640">
</p>

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)

**Stack-focused Claude Code plugin for Next.js + React + Supabase.**

Slash commands that scaffold the code, skills that raise the standard of whatever you write next, and a routing hook that reaches for the right one before you think to ask for it. Composes with [superpowers](https://github.com/obra/superpowers): that plugin owns the process, this one owns the stack.

<!-- AUTOGEN:counts -->
**17 commands** · **6 agents** · **14 skills** · **14 hooks** · **2 monitors**
<!-- /AUTOGEN:counts -->

---

## Install

> **Pick one.** Installing by more than one route leaves you with every skill twice.

<details>
<summary><strong>Claude Code plugin</strong> — the fastest way in</summary>

From inside a session:

```text
/plugin marketplace add gr8monk3ys/skills
/plugin install lorenzos-claude-code
```

The two names differ on purpose. `gr8monk3ys/skills` is the repository; `lorenzos-claude-code` is the plugin that lives inside it. Neither is a typo for the other, and neither works in the other's place.

Installing this way subscribes you to the marketplace rather than copying files out of it, so later releases are an update away instead of a re-install.

Working from a local clone instead? The trailing `./` is load-bearing — a bare `.` is rejected:

```bash
claude plugin marketplace add ./
```

</details>

<details>
<summary><strong>Any agent, via the skills installer</strong></summary>

```bash
npx skills@latest add gr8monk3ys/skills
```

Two honest caveats. This is third-party tooling, and we have not run this route end to end against this repo — if it misbehaves, the bug is as likely to be ours as theirs, so please open an issue. And it copies skill files into your project as ordinary files you own and edit, which means you are forking rather than subscribing: later releases arrive only when you go and get them.

</details>

<details>
<summary><strong>npm</strong> — the <code>lcc</code> CLI</summary>

```bash
npm install -g @gr8monk3ys/claude-code-plugin
lcc install
lcc doctor
```

`lcc install` writes the commands, agents, skills, and hooks into your Claude Code configuration. Run `lcc doctor` afterwards rather than assuming: a half-landed install looks exactly like a working one right up to the first time you need a hook that isn't there.

</details>

---

## Why these exist

Three failure modes worth naming, and what in here answers each.

### You know what to build, and hand-scaffolding it is the slow part

You have decided on the component, the route, the table policy. What stands between you and it is twenty minutes of boilerplate that comes out slightly different every time — a different error shape here, validation skipped there, and a codebase that reads like four people wrote it.

The `-new` commands take that pass off you: `/component-new`, `/hook-new` and `/page-new` for the React side, `/api-new`, `/action-new` and `/edge-function-new` for endpoints, `/rls-new` and `/types-gen` for Supabase, `/test-new` for the tests. Behind them sit three skills the agent reaches for on its own when your prompt or your file paths say it should — [api-development](docs/engineering/api-development.md), [frontend-development](docs/engineering/frontend-development.md), and [database-operations](docs/engineering/database-operations.md). The commands give you the file; the skills are why the tenth file matches the first.

### The code works on your machine and nowhere else

The demo went fine. CI is red, and now you are reading a log to find out which of six things broke.

`/verify` runs the whole gauntlet in one go — build, types, lint, tests, security, and a read of your own diff — so the answer arrives before the push instead of after it. `/review` is the gate you run before calling something done. When CI does go red anyway, `/babysit` watches the PR and fixes failures as they land, `/fixissue` takes a GitHub issue from fetch to merged branch, and `/automerge` validates, merges, and cleans up behind itself. [background-automation](docs/engineering/background-automation.md) is the skill underneath that work — it is what the agent reaches for when something needs watching on a loop rather than doing once.

### A step needs a human, and explaining it again every time is the cost

Some steps an agent simply cannot take. Minting a key, clicking through a dashboard behind your login, flipping a switch only your account owns. The usual outcome is a numbered list pasted into the chat that you follow by hand, get four steps into, and lose to a scrolled-away terminal.

[wizard](docs/engineering/wizard.md) writes a bash script instead. It opens each URL in turn, says what to click, reads secrets with hidden entry, writes them into `.env` and your CI secrets, and tells you at the end what it could not do and you must finish yourself. Ctrl-C and re-run picks up where you left off. The procedure stops living in someone's head, and stops being re-explained.

---

## Pairs with superpowers

This plugin focuses on **stack-specific scaffolding**. Process discipline — brainstorming, writing plans, executing them, debugging, verifying — lives in [superpowers](https://github.com/obra/superpowers). The two compose:

- **superpowers** handles *how* to work.
- **lorenzos-claude-code** handles *what* to build: concrete Next.js, React, and Supabase scaffolds.
- The `skill-activator` hook (in this plugin) scores incoming prompts across keywords, patterns, file paths, directories, and intents, then routes to the right skill — whether that skill lives here or in superpowers.

Skills of ours that would have duplicated a superpowers one are deliberately kept unshipped, so routing never has two right answers.

---

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

Each skill has a page written for the human deciding whether to reach for it. They split on one axis: who can invoke them.

**User-invoked.** Nothing will surface these for you, so you type them.

- [ask-lorenzo](docs/engineering/ask-lorenzo.md) — names the one command or skill that fits what you're trying to do, and hands off.
- [handoff](docs/productivity/handoff.md) — compacts a session into a document the next agent can start from.
- [to-questionnaire](docs/productivity/to-questionnaire.md) — turns a decision you can't make alone into a document for the person who can.
- [wait-what](docs/productivity/wait-what.md) — for the moment a message doesn't land: it gets re-pitched with the context you were missing.

**Model-invoked.** You can type these too, but the agent reaches for them on its own when the task fits.

- Four raise the standard of the stack code you write: [api-development](docs/engineering/api-development.md), [frontend-development](docs/engineering/frontend-development.md), [database-operations](docs/engineering/database-operations.md), and [background-automation](docs/engineering/background-automation.md).
- Six cover the work around the code: [wizard](docs/engineering/wizard.md) for steps only a human can take, [resolving-merge-conflicts](docs/engineering/resolving-merge-conflicts.md) mid-merge, [prototype](docs/engineering/prototype.md) to answer a design question with throwaway code, [research](docs/engineering/research.md) to investigate against primary sources, [domain-modeling](docs/engineering/domain-modeling.md) to sharpen the project's vocabulary, and [writing-for-agents](docs/productivity/writing-for-agents.md) for when the thing you're writing is itself read by an agent.

## Hooks

<!-- AUTOGEN:hooks -->
| Name | Description |
| --- | --- |
| `auto-format` |  |
| `block-sensitive-files` |  |
| `notify-completion` |  |
| `permission-request` |  |
| `post-tool-failure` |  |
| `pre-compact` |  |
| `session-end` |  |
| `session-start` |  |
| `setup` |  |
| `skill-activator` |  |
| `status-line` |  |
| `subagent-start` |  |
| `subagent-stop` |  |
| `validate-json` |  |
<!-- /AUTOGEN:hooks -->

## Monitors

Background watchers (`.claude/monitors/monitors.json`) stream long-running command output into the session as notifications — surfacing type and runtime errors before they reach CI. They are example defaults; adjust the commands and log paths to match your project.

<!-- AUTOGEN:monitors -->
| Name | Description |
| --- | --- |
| `next-dev` | Surfaces Next.js dev-server runtime errors and failed compilations |
| `typecheck-watch` | Streams TypeScript type errors as you edit, before they reach CI |
<!-- /AUTOGEN:monitors -->

## MCP Servers

| Server | Purpose |
| --- | --- |
| `context7` | Library documentation lookup |
| `memory` | Cross-session memory |
| `playwright` | Browser automation |
| `github` | PRs, issues, repository operations |

---

## Skill auto-routing

The `skill-activator` hook scores prompts across five dimensions with weighted confidence:

| Dimension | Weight |
| --- | --- |
| Keywords | 2 |
| Patterns | 3 |
| File paths | 4 |
| Directories | 5 |
| Intents | 4 |

At ≥8 points the matching skill is auto-activated; at ≥5 points it is suggested. Rules live in `hooks/skill-rules.json`. The activator surfaces both this plugin's stack skills and any superpowers skills that match — one routing layer for the whole toolkit.

---

## Requirements

- Claude Code 2.0.13+
- Node.js 18+

## License

GPL-3.0 — see [LICENSE](LICENSE).

## Contributing

See [ROADMAP.md](ROADMAP.md) for upcoming work.
