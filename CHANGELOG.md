# Changelog

All notable changes to Lorenzo's Claude Code plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 1.0.0 (2026-08-20)


### Features

* **agents:** add architecture, review, and testing subagents ([c9f43a0](https://github.com/gr8monk3ys/skills/commit/c9f43a0167c6c555b5338d8723a974e2dcc8d4bc))
* bucket skill layout, 15 ported skills, ask-lorenzo router, CONTEXT.md ([#39](https://github.com/gr8monk3ys/skills/issues/39)) ([a687a7d](https://github.com/gr8monk3ys/skills/commit/a687a7d4b12a77547e0ca04ffd221bc49cb107a5))
* **cli:** add install/update/doctor CLI and project detection ([3a07a04](https://github.com/gr8monk3ys/skills/commit/3a07a04af3177e88ebef42d8189e9803430fa637))
* **commands:** add babysit, automerge, and fixissue workflow commands ([7a8ebf5](https://github.com/gr8monk3ys/skills/commit/7a8ebf569de9a662d7b2d1c70fc2676c4babfbad))
* **commands:** add lint, review, test, verify, and deploy commands ([adc8844](https://github.com/gr8monk3ys/skills/commit/adc884402dc18a83160b0f8ae55b06c06a8e99ba))
* **commands:** add Next.js, React, and API route scaffolders ([02721e4](https://github.com/gr8monk3ys/skills/commit/02721e448d77ac38b0e93fe5df6c659f3d0d9364))
* **commands:** add Supabase types, RLS, and Edge Function scaffolders ([63c7519](https://github.com/gr8monk3ys/skills/commit/63c75197a2caea116a009a89a56b5d64a35da09f))
* configure MCP servers and background monitors ([a7f10b1](https://github.com/gr8monk3ys/skills/commit/a7f10b17c7196a0f76a294c7132cb367b7f69535))
* **hooks:** add lifecycle hooks for formatting, secret-blocking, and skill routing ([41e139f](https://github.com/gr8monk3ys/skills/commit/41e139f8eaac44d588ca2d22590e5145918375aa))
* **plugin:** define plugin manifest and marketplace metadata ([f254167](https://github.com/gr8monk3ys/skills/commit/f2541677ee383388aa29caa98b8510138797633e))
* **skills:** add API, frontend, database, and automation skills with routing rules ([7d1e79c](https://github.com/gr8monk3ys/skills/commit/7d1e79c4ef755b173a75b70a71ad9b35978ec31a))


### Bug Fixes

* make the plugin installable via /plugin install ([#40](https://github.com/gr8monk3ys/skills/issues/40)) ([8edf990](https://github.com/gr8monk3ys/skills/commit/8edf990613555496bfbef275c451f5f5b4688a42))
* make the plugin's own standards agree with each other ([#42](https://github.com/gr8monk3ys/skills/issues/42)) ([7904186](https://github.com/gr8monk3ys/skills/commit/7904186589b8aef4e1380024724921b4c96fde3f))

## [4.1.0] - 2026-06-18

Modernizes the plugin for mid-2026 Claude Code: current model IDs, background-automation
primitives (loops, monitors, PR babysitting), and two scaffolders promised on the roadmap.

### Added

- **`/rls-new`** — scaffold Supabase Row Level Security policies from a plain-language
  access description, with deny-by-default policies, a performance pass, and pgTAP tests.
- **`/action-new`** — scaffold a Next.js 15 Server Action with `'use server'`, Zod
  validation, an auth re-check, a typed result shape, and a `useActionState` client wiring.
- **`/babysit`** — watch a PR in a loop and auto-fix CI failures and review comments,
  wiring PR activity subscriptions, `/loop`, and monitors together.
- **`background-automation` skill** — guidance on loops, monitors, background tasks, and
  PR activity subscriptions, with rules (never `sleep` to wait on events) and recipes.
  Registered in `skill-rules.json` for auto-routing.
- **Monitors** — `.claude/monitors/monitors.json` background watchers (TypeScript and
  Next.js dev-server output). Wired into the sync-manifest pipeline: `scanMonitors` plus a
  new `monitors` count and README table, kept drift-free in CI like every other category.

### Changed

- Updated every command's `model` frontmatter to current IDs: `claude-opus-4-5` →
  `claude-opus-4-8`, `claude-sonnet-4-5` → `claude-sonnet-4-6`.

### Fixed

- `/page-new` command was committed with embedded NUL/control bytes (corrupted
  box-drawing characters in the file-tree and broken glyphs in the bullet lists). The
  frontmatter was intact, so manifest sync never caught it. Restored to clean UTF-8.
- The `Claude PR Review` and `Claude Security Scan` workflows hard-failed on every PR
  when no `ANTHROPIC_API_KEY`/`CLAUDE_CODE_OAUTH_TOKEN` secret was configured, and passed
  inputs (`model`, `timeout_minutes`, `allow_edits`) the current action rejects. They now
  skip cleanly when no credentials are present and select the model via `claude_args`.

## [4.0.0] - 2026-05-07

### BREAKING — Rescope to Stack Scaffolding

Repositioned from a general-purpose toolkit into a focused Next.js + React + Supabase scaffolding plugin that composes with [superpowers](https://github.com/obra/superpowers). Documentation and manifest drift fixed at the source: filesystem is now the single source of truth, generated outputs are checked in CI.

#### Before → After

| Component | v3 (on disk) | v4 |
| --- | --- | --- |
| Commands | 21 | 14 |
| Skills | 10 | 3 |
| Hooks | 15 | 14 |
| Manifest sources of truth | 5 (drifted) | 1 (filesystem) |
| Published to npm | promised, missing | yes |

#### Removed (use superpowers replacements)

- **Skills**: `circuit-breaker` → `superpowers:systematic-debugging`; `verification-first` → `superpowers:verification-before-completion`; `micro-tasking` → `superpowers:executing-plans`; `memory-persistence` → Claude Code built-in memory; `code-quality` → `superpowers:requesting-code-review`; `continuous-learning` and `research` → no direct superpowers replacement (`superpowers:brainstorming` and `superpowers:writing-skills` cover overlapping ground).
- **Commands**: `/plan` → `superpowers:writing-plans`; `/research`, `/learn`, `/evolve`, `/pickup`, `/handoff` → covered by `superpowers:brainstorming`, `superpowers:executing-plans`, and built-in session continuity; `/memory` → Claude Code built-in memory.
- **Hook**: `circuit-breaker.js` (use `superpowers:systematic-debugging`).
- **Files**: `.claude/TODO.md` (replaced by `ROADMAP.md`), `.claude/instincts/`, `.claude/ledger/` (orphan data dirs).

### Added

- `scripts/sync-manifest.js` — regenerates `plugin.json` and AUTOGEN sections of `README.md` / `CLAUDE.md` from the filesystem.
- `npm run sync` and `npm run sync:check`. The `--check` mode is wired into `prepublishOnly`, pre-commit, and CI.
- `tests/manifest-sync.test.js` — node:test unit tests for the sync logic.
- `ROADMAP.md` — concrete near-term work.

### Changed

- `README.md` — full rewrite. New pitch focuses on stack scaffolding and explicit superpowers composition. The "vs. competition" framing is removed.
- `CLAUDE.md` — slimmed to project memory.
- `bin/cli.js doctor` — expected counts updated.

### Why

The v3.0.0 "innovations" (circuit-breaker, verification-first, micro-tasking) now have direct counterparts in the official superpowers skill system. Continuing to ship them as differentiators is no longer credible. This release positions the plugin where it adds genuine value — Next.js / React / Supabase scaffolding — and fixes the documentation/manifest drift that had accumulated since v3.0.0.

---

## [3.0.0] - 2026-01-31

### BREAKING - Aggressive Simplification

Reduced plugin by ~73% to focus on what matters. This is a breaking change.

#### Before → After

| Component | Before | After | Removed |
| --------- | ------ | ----- | ------- |
| Commands  | 66     | 15    | 51      |
| Agents    | 25     | 6     | 19      |
| Skills    | 24     | 8     | 16      |
| Hooks     | 19     | 9     | 10      |

#### Removed Commands (51)

- **Framework-specific**: Vue, Angular, Svelte components
- **Planning variants**: brainstorm, riper, research, innovate, create-prd, execute-plan
- **Context bloat**: context, context-budget, context-mode, context-prime, memory-init
- **Workflow over-engineering**: wizard, chain, harness, wiggum, ledger, checkpoint, eval, learn, blast-radius, resume, plan-init, fix-pr
- **DevOps niche**: parallel-spawn, worktree, mcp-init, ci-review
- **Generation niche**: scaffold, brand-voice, sop-create, docs-generate, docs-codemap, migration-new
- **Quality variants**: code-cleanup, code-optimize, code-explain, new-task, tdd, fix-issue
- **Utility**: ask, think, summarize, rules, suggest, architect, map, github-setup, api-protect

#### Removed Agents (19)

- **Redundant**: system-architect, api-architect, refactoring-expert
- **Domain-specific**: fintech-engineer, chaos-engineer, llm-architect, mcp-developer
- **Rarely needed**: competitive-analyst, technical-writer, learning-guide, deep-research-agent
- **Consolidated**: security-engineer, performance-engineer, database-architect, accessibility-auditor, e2e-runner, migration-planner, requirements-analyst, tech-stack-researcher

#### Removed Hooks (10)

- **Broken**: context-budget.sh, subagent-logger.sh, continuous-learning.sh
- **Risky**: auto-commit.sh (auto-commits without review)
- **Slow**: typecheck.sh, detect-deadcode.sh, detect-duplication.sh (run on every edit)
- **Incomplete**: input-modifier.sh, test-gate.sh
- **Spam**: strategic-compact.sh

#### Removed Skills (16)

- python-refactoring, strategic-compact, continuous-learning, three-tier-memory
- mcp-builder, skill-creator, webapp-testing, git-worktree, parallel-dispatch
- progressive-disclosure, root-cause-analysis, spec-compliance, eval-harness
- auto-test-prompt, devops-automation, systematic-debugging

### Kept (Core Essentials)

**Commands (15)**: component-new, page-new, hook-new, api-new, api-test, test-new, verify, plan, lint, review, deploy, types-gen, edge-function-new, handoff, memory

**Agents (6)**: code-reviewer, backend-architect, frontend-architect, build-error-resolver, test-strategist, devops-engineer

**Skills (8)**: api-development, frontend-development, database-operations, verification-first, memory-persistence, code-quality, circuit-breaker, micro-tasking

**Hooks (9)**: session-start, session-end, block-sensitive-files, validate-json, auto-format, circuit-breaker, pre-compact, notify-completion, skill-activator

### Why

- Reduced cognitive load by 73%
- Removed broken/theoretical code
- Focused on Next.js + React + Supabase workflow
- Quality over quantity

---

## [2.2.0] - 2026-01-31

### Added - Context Efficiency & Superpower Enhancements

#### Plugin Structure Overhaul

- **Complete plugin.json manifest** - Added explicit arrays for all 66 commands, 25 agents, 23 skills, 4 orchestrators
- Previously relied on auto-discovery; now properly declared for compatibility with official Claude Code plugin loader

#### Context Optimization Features (NEW)

- **Tool Search configuration** - `enableToolSearch: true` for 85% token reduction
- **Deferred tool loading** - `deferToolLoading: true` for on-demand MCP tool definitions
- **Context thresholds** - `maxContextUsage: 0.85`, `compactionThreshold: 0.70`
- **Thinking profiles** - Four tiers: light (1K), medium (8K), deep (32K), ultra (64K) token budgets

#### Missing Hooks Added (3)

- **input-modifier.sh** (PreToolUse) - Modifies tool inputs, auto-approves docs, adds timeouts
- **pre-compact.sh** (PreCompact) - Saves critical context before compaction
- **subagent-logger.sh** (SubagentStop) - Logs subagent completions for orchestrator debugging

### Fixed

- **hooks.json** - Now includes all 18 hooks (was 15, missing 3)
- **Version synchronization** - All documentation now matches v2.2.0

### Changed

- Plugin now at **66 commands**, **25 agents**, **23 skills**, **4 orchestrators**, **18 hooks**
- Updated plugin description to accurately reflect CLI-first, context-efficient approach
- Removed incorrect MCP counts from README (was claiming 29, now correctly shows 4 minimal profile)

### Documentation

- Synchronized all component counts across CLAUDE.md, README.md, plugin.json
- Added context optimization documentation to plugin.json
- Added thinking profiles for extended thinking mode allocation

### Sources

- [Claude Code Best Practices](https://www.anthropic.com/engineering/claude-code-best-practices)
- [Tool Search Token Reduction](https://medium.com/@joe.njenga/claude-code-just-cut-mcp-context-bloat-by-46-9-51k-tokens-down-to-8-5k-with-new-tool-search-ddf9e905f734)
- [everything-claude-code](https://github.com/affaan-m/everything-claude-code)
- [claude-flow Multi-Agent Framework](https://github.com/ruvnet/claude-flow)

## [1.20.0] - 2026-01-23

### Added - Claude Code v2.1 Features

#### New Commands (4)

- **/checkpoint** - Named checkpoint management for save/restore workflows
  - `save`, `list`, `restore`, `delete` actions
  - Complements built-in `/rewind` and `Esc+Esc`
  - Stores in `~/.claude/checkpoints/[project-hash]/`

- **/think** - Explicit thinking mode triggers
  - Four levels: standard, think (~4K), megathink (~10K), ultrathink (~32K)
  - Token budget allocation for complex problems
  - Guidelines for when to use each level

- **/plan-init** - Initialize `plansDirectory` for version-controlled plans
  - Creates `.claude/plans/` structure
  - Adds templates for feature and refactor plans
  - Integrates with `/feature-plan` and `/write-plan`

- **/mcp-init** - Initialize project-scoped `.mcp.json`
  - Team-shareable MCP configurations
  - Environment variable templates
  - Security best practices for credentials

#### New Hook (1)

- **input-modifier.sh** (PreToolUse) - Input modification hook example
  - Demonstrates modifying tool inputs before execution
  - Auto-approves documentation files
  - Adds timeouts to curl commands
  - Enforces `--save-exact` for npm install

#### Enhanced Commands

- **/handoff** - Added Teleport integration section
  - When to use `/teleport` vs `/handoff` vs `/resume`
  - Workflow for moving sessions to claude.ai/code
  - Limitations of teleported sessions

### Documentation

- Added thinking mode token budgets and best practices
- Added plansDirectory configuration guide
- Added project-scoped MCP security considerations
- Added input modification hook patterns

### Changed

- Updated plugin to **64 commands** (was 60) - Added: /checkpoint, /think, /plan-init, /mcp-init
- Updated plugin to **15 hooks** (was 14) - Added: input-modifier
- Bumped version to 1.20.0

### Claude Code v2.1 Features Supported

- Checkpoints and `/rewind` (documented in /checkpoint)
- Thinking modes: think, megathink, ultrathink
- `plansDirectory` setting
- Project-scoped `.mcp.json`
- Input modification hooks (`updatedInput` field)
- `/teleport` awareness in handoffs
- `SubagentStop` and `PreCompact` hook events (added in v1.19.0)

### Sources

- [Claude Code Checkpointing Docs](https://code.claude.com/docs/en/checkpointing)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [Claude Code MCP Configuration](https://code.claude.com/docs/en/mcp)
- [Claude Code v2.1.0 Release Notes](https://github.com/anthropics/claude-code/releases)

## [1.19.0] - 2026-01-23

### Added

#### New Agents (2)

- **build-error-resolver** - TypeScript/build error specialist with minimal-diff approach
  - Categorizes errors by type (inference, imports, config, dependencies)
  - Applies <5% line change constraint per file
  - Prohibited from architectural changes during fixes
  - Source: [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

- **e2e-runner** - Playwright/Cypress E2E testing specialist
  - Flaky test detection with `--repeat-each=10` methodology
  - Quarantine tactics using `test.fixme()` for unstable tests
  - Page Object Model enforcement
  - Artifact collection strategy (screenshots, videos, traces)
  - Target metrics: 95%+ pass rate, <5% flaky rate
  - Source: [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

#### New Skills (1)

- **systematic-debugging** - Evidence-based debugging methodology
  - Iron Law: 5-step verification before any claim (IDENTIFY → RUN → READ → VERIFY → CLAIM)
  - Rationalization counters table for common debugging excuses
  - Red flags detection (hedging language, premature satisfaction)
  - Integrates with root-cause-analysis for full debugging workflow
  - Source: [obra/superpowers](https://github.com/obra/superpowers)

#### New Hooks (2)

- **pre-compact.sh** (PreCompact event) - Saves critical context before compaction
  - Archives recent file changes and git status
  - Preserves working context to `~/.claude/memory/pre-compact-context.md`
  - Enables context restoration after compaction

- **subagent-logger.sh** (SubagentStop event) - Logs subagent completions
  - Records completions to `~/.claude/logs/subagent-completions.jsonl`
  - Useful for debugging orchestrator workflows
  - Special handling for review and test agents

#### New MCP Servers (7)

- **Atlassian** (`@atlassian/mcp-server`) - Jira/Confluence integration via OAuth 2.0
- **Firecrawl** (`@firecrawl/mcp`) - Web scraping with LLM-powered extraction
- **Semgrep** (`@semgrep/mcp`) - SAST security scanning with 5000+ rules
- **Tavily** (`@tavily/mcp`) - AI-optimized web search for RAG workflows
- **DuckDB** (`@motherduckdb/mcp-server-motherduck`) - Local analytics for CSV/Parquet/SQL
- **GitLab** (`@gitlab/mcp-server`) - GitLab MRs, pipelines, and issues
- Source: [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)

#### New Command (1)

- `/docs-codemap` - Generate structured CODEMAPS documentation
  - Creates INDEX.md, frontend.md, backend.md, database.md, integrations.md, workers.md
  - ASCII architecture diagrams
  - Uses ts-morph and madge for analysis
  - Source: [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

### Enhanced

- **verification-first skill** - Added 5-step iron law verification gate
  - Step-by-step process: IDENTIFY → RUN → READ → VERIFY → ONLY THEN
  - Red flags section for detecting premature completion
  - Increased priority to 90 for critical workflow enforcement
  - Source: [obra/superpowers](https://github.com/obra/superpowers)

- **TDD command** - Added rationalization counters
  - Table of common TDD excuses with rebuttals
  - Red flags for detecting TDD violations
  - Additional mantras for discipline
  - Source: [obra/superpowers](https://github.com/obra/superpowers)

- **continuous-learning skill** - Added circuit breaker pattern
  - Detection triggers: no file changes, identical errors, declining output
  - Recovery actions for stuck states
  - Manual reset options
  - Source: [Continuous-Claude-v3](https://github.com/parcadei/Continuous-Claude-v3)

### Documentation

- **README.md** - Added context window warning for MCP servers
  - Warning: 200k context can shrink to ~70k with too many tools
  - Recommendation: Keep under 10 MCP servers enabled per project

- **SKILLS.md** - Complete rewrite with all 19 skills documented
  - Previously showed 5 skills, now accurately lists all 19
  - Added skill priority system documentation
  - Added Session & Context skills section

### Changed

- Updated plugin to **60 commands** (was 59) - Added: /docs-codemap
- Updated plugin to **26 agents** (was 24) - Added: build-error-resolver, e2e-runner
- Updated plugin to **19 skills** (was 18) - Added: systematic-debugging
- Updated plugin to **29 MCP servers** (was 22) - Added: atlassian, firecrawl, semgrep, tavily, duckdb, gitlab
- Updated plugin to **14 hooks** (was 12) - Added: pre-compact, subagent-logger
- Bumped version to 1.19.0

### Research Sources

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Build error resolver, E2E runner, CODEMAPS
- [obra/superpowers](https://github.com/obra/superpowers) - Verification gates, rationalization counters, systematic debugging
- [Continuous-Claude-v3](https://github.com/parcadei/Continuous-Claude-v3) - Circuit breaker pattern
- [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers) - New MCP server recommendations
- Claude Code plugin ecosystem research - Best practices and patterns

## [1.18.0] - 2026-01-22

### Added

- **Memory Persistence System** (HIGH VALUE) - Cross-session continuity
  - `session-start.sh` hook - Restores previous context when sessions begin
  - `session-end.sh` hook - Persists session state when sessions complete
  - `memory-persistence` skill - Guidelines for using the memory system
  - Sessions stored in `~/.claude/sessions/` with 7-day retention
  - Learned skills persist in `~/.claude/skills/learned/`

- **Strategic Compaction System** (HIGH VALUE) - Intelligent context management
  - `strategic-compact.sh` hook - Monitors Edit/Write operations, suggests compaction at natural breakpoints
  - `strategic-compact` skill - Guidelines for user-controlled context management
  - Prevents auto-compaction from triggering mid-task

- **Verification Loop Command** (HIGH VALUE) - `/verify`
  - 6-phase comprehensive quality checks: Build, Types, Lint, Tests, Security, Diff
  - Structured pass/fail reporting
  - PR readiness assessment
  - Recommended cadence: every 15 minutes during extended sessions

- **Continuous Learning System** (MEDIUM-HIGH VALUE)
  - `continuous-learning.sh` hook - Analyzes sessions for learnable patterns
  - `continuous-learning` skill - Framework for pattern extraction
  - `/learn` command - Manually trigger learning analysis
  - Extracts: error resolutions, user corrections, workarounds, debugging techniques

- **Context Modes** (MEDIUM VALUE) - Dynamic behavior switching
  - `.claude/contexts/dev.md` - Development mode (code-first, rapid iteration)
  - `.claude/contexts/review.md` - Review mode (quality-focused, thorough analysis)
  - `.claude/contexts/research.md` - Research mode (exploration, investigation)
  - `/context-mode` command - Switch between modes

- **Eval Harness** (MEDIUM VALUE) - Eval-driven development
  - `eval-harness` skill - EDD framework with grader types
  - `/eval` command - Run eval checks with pass@k metrics
  - Three grader types: Code-based, Model-based, Human
  - Metrics: pass@k (at least one success), pass^k (all succeed)

- **Competitive Analysis** - Research on everything-claude-code repository
  - `.claude/docs/competitive-analysis-everything-claude-code.md`
  - Identified key differentiators and implementation roadmap
  - Source: Anthropic x Forum Ventures Hackathon Winner (Sep 2025)

### Changed

- Updated plugin to **59 commands** (was 55) - Added: /verify, /learn, /eval, /context-mode
- Updated plugin to **18 skills** (was 14) - Added: memory-persistence, strategic-compact, continuous-learning, eval-harness
- Updated plugin to **12 hooks** (was 8) - Added: session-start, session-end, strategic-compact, continuous-learning
- Added **3 context modes** - dev, review, research
- Bumped version to 1.18.0

### Architecture

- New `.claude/contexts/` directory for dynamic system prompts
- New hooks in `.claude/hooks/`: session-start.sh, session-end.sh, strategic-compact.sh, continuous-learning.sh
- New skills: memory-persistence, strategic-compact, continuous-learning, eval-harness
- New commands: verify.md, learn.md, eval.md, context-mode.md

### Sources

- [everything-claude-code](https://github.com/affaan-m/everything-claude-code) - Anthropic Hackathon Winner
- Memory persistence patterns from hackathon-winning implementation
- Strategic compaction from workflow optimization research
- Eval-driven development from AI quality assurance research

## [1.17.0] - 2026-01-15

### Added

- **6 New Commands** (56 total)
  - `/harness` - Configure safety guardrails for autonomous development (Principal Skinner Harness)
  - `/chain` - Chain multiple commands together for automated workflows
  - `/suggest` - Get AI-powered command suggestions based on current context
  - `/summarize` - Intelligently summarize files/directories to reduce token usage
  - `/github-setup` - Set up GitHub integration for PR reviews and security scans

- **Documentation**
  - `DEVCONTAINER.md` - Comprehensive guide for DevContainer benefits and usage

### Changed

- Updated plugin to **56 commands** (was 50)
- Marked several TODO items as complete

## [1.16.0] - 2026-01-15

### Added

- **4 New Commands** (50 total)
  - `/ci-review` - Run Claude Code in headless mode for CI/CD automated code review
  - `/worktree` - Git worktree management for isolated parallel development
  - `/memory-init` - Initialize persistent memory/knowledge graph for cross-session context
  - `/context-budget` - Monitor and optimize context/token usage for efficient sessions

- **6 New MCP Servers** (22 total)
  - **Terraform** (`@anthropic/mcp-server-terraform`) - Infrastructure as code operations
  - **Kubernetes** (`@anthropic/mcp-server-kubernetes`) - Cluster management and kubectl operations
  - **Docker** (`@anthropic/mcp-server-docker`) - Container and image management
  - **Sentry** (`@anthropic/mcp-server-sentry`) - Error tracking and performance monitoring
  - **Datadog** (`@anthropic/mcp-server-datadog`) - Observability, metrics, and log analysis
  - **AWS** (`@anthropic/mcp-server-aws`) - S3, Lambda, DynamoDB, CloudWatch operations

### Changed

- Updated plugin to **50 commands** (was 46)
- Updated plugin to **22 MCP servers** (was 16)

## [1.15.0] - 2026-01-15

### Added

- **DevContainer Configuration** - Sandboxed development environment matching official anthropics/claude-code
  - `.devcontainer/devcontainer.json` - Container config with Claude Code feature, VS Code extensions
  - `.devcontainer/Dockerfile` - Node.js 20 base with Claude Code, TypeScript, Playwright pre-installed
  - `.devcontainer/init-firewall.sh` - Security: whitelist-only network access script
  - Docker volume persistence for `~/.claude` configuration

- **GitHub Actions CI/CD** - Automated workflows for quality and security
  - `.github/workflows/claude-pr-review.yml` - AI-powered PR reviews on @claude mention
  - `.github/workflows/claude-security-scan.yml` - Security vulnerability scanning using Claude Opus
  - `.github/workflows/ci.yml` - Plugin validation, structure checks, markdown linting

- **VS Code Configuration** - Editor settings for optimal development experience
  - `.vscode/settings.json` - Recommended editor, TypeScript, ESLint, Prettier settings
  - `.vscode/extensions.json` - Recommended extensions (Claude Code, ESLint, Prettier, Playwright, etc.)
  - `.vscode/launch.json` - Debug configurations for plugin validation and tests

- **Memory MCP Server** - Persistent knowledge graph for cross-session context
  - Added `@modelcontextprotocol/server-memory` to plugin.json

### Changed

- Updated plugin to **16 MCP servers** (was 15)
- Updated TODO.md with research from official anthropics/claude-code repository

### Sources

- [anthropics/claude-code DevContainer](https://github.com/anthropics/claude-code/tree/main/.devcontainer)
- [anthropics/devcontainer-features](https://github.com/anthropics/devcontainer-features)
- [anthropics/claude-code-action](https://github.com/anthropics/claude-code-action)
- [anthropics/claude-code-security-review](https://github.com/anthropics/claude-code-security-review)
- [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers)

## [1.13.0] - 2026-01-14

### Added

- **Ralph Wiggum Pattern** - Autonomous iterative development
  - `/wiggum` - Autonomous development loops with stateless resampling and safety guardrails
  - State management via `.claude/wiggum/` directory (TASK.md, PROGRESS.md, DONE.md, STATUS)
  - Principal Skinner Harness for safety limits (iterations, time, file changes, protected paths)

- **6 New Skills** (14 total)
  - `verification-first` - Verify work is complete before claiming completion
  - `micro-tasking` - Break work into small, verifiable 2-5 minute tasks
  - `root-cause-analysis` - 4-phase debugging methodology (Observe, Hypothesize, Test, Fix)
  - `git-worktree` - Isolated branch workflows for parallel development
  - `parallel-dispatch` - Coordinate concurrent agent work and multi-agent workflows
  - `spec-compliance` - Verify implementation matches specifications and requirements

- **4 New MCP Servers** (15 total)
  - **Figma** (`@anthropic/mcp-server-figma`) - Design file access and component inspection
  - **Notion** (`@anthropic/mcp-server-notion`) - Workspace access for docs and knowledge bases
  - **Linear** (`@linear/mcp-server`) - Issue tracking and project management
  - **Slack** (`@anthropic/mcp-server-slack`) - Workspace access for channel and message operations

### Changed

- Updated plugin to **59 commands** (was 58)
- Updated plugin to **14 skills** (was 8)
- Updated plugin to **15 MCP servers** (was 11)
- Updated all documentation to reflect new counts

## [1.12.0] - 2026-01-14

### Added

- **5 New MCP Servers** (11 total)
  - **GitHub** (`@modelcontextprotocol/server-github`) - Repository operations, issues, PRs, CI/CD workflows
  - **Sequential Thinking** (`@modelcontextprotocol/server-sequential-thinking`) - Structured problem-solving with step-by-step reasoning
  - **PostgreSQL** (`@modelcontextprotocol/server-postgres`) - Read-only database access and schema inspection
  - **Redis** (`@modelcontextprotocol/server-redis`) - Key-value store operations
  - **MongoDB** (`@mongodb-js/mongodb-mcp-server`) - MongoDB operations and Atlas management

- **Session Management Commands** (3 new commands)
  - `/handoff` - Create YAML session transfer document for context handoff
  - `/resume` - Load previous session context from handoff document
  - `/ledger` - View/update session progress ledger with task tracking

- **RIPER Workflow Commands** (4 new commands)
  - `/riper` - Full 5-phase structured development workflow
  - `/research` - Phase 1: Deeply understand the problem before solving
  - `/innovate` - Phase 2: Explore multiple solutions before committing
  - `/review` - Phase 5: Quality gates before considering work complete

- **New Directories**
  - `.claude/handoffs/` - Session handoff documents
  - `.claude/ledger/` - Session progress ledger

### Changed

- Updated plugin to **58 commands** (was 51)
- Updated plugin to **11 MCP servers** (was 6)
- Updated all documentation to reflect new counts

## [1.11.1] - 2026-01-13

### Fixed

- Registered 6 missing commands in plugin.json (`/map`, `/architect`, `/context`, `/memory`, `/rules`, `/ask`)
- Fixed "L" prefix typo in `.claude/commands/api/api-new.md`
- Removed redundant `.env.local` and `.env.production` patterns in `block-sensitive-files.sh` hook

### Changed

- Updated command count from 45 to 51 in plugin description and documentation

## [1.11.0] - 2026-01-13

### Added

- **Fintech Specialist** - New agent for financial technology
  - `fintech-engineer` - Payment systems, compliance (PCI-DSS, KYC/AML), fraud detection

- **New Skills (2)**
  - `webapp-testing` - Playwright/E2E testing patterns, visual regression, accessibility automation
  - `skill-creator` - Create custom Claude Code skills with proper structure and frontmatter

- **obra/superpowers-Inspired Commands (3)**
  - `/brainstorm` - Collaborative brainstorming with divergent/convergent thinking
  - `/write-plan` - Create detailed implementation plans with phases and checkpoints
  - `/execute-plan` - Step-by-step execution with verification at each stage

### Changed

- Plugin now includes 45 commands (was 42)
- Plugin now includes 24 agents (was 23)
- Plugin now includes 8 skills (was 6)

## [1.10.0] - 2026-01-13

### Added

- **Community-Inspired Features** - Based on awesome-claude ecosystem research

**New Specialized Agents (4):**

- `chaos-engineer` - System resilience testing, failure injection, gameday planning
- `mcp-developer` - Build MCP servers to extend Claude with custom tools
- `llm-architect` - Design LLM applications, RAG systems, agent workflows
- `competitive-analyst` - Market research, competitor analysis, strategic insights

**New Workflow Commands (7):**

- `/context-prime` (+ `/prime` alias) - Load comprehensive project context
- `/tdd` - Test-Driven Development workflow (Red-Green-Refactor)
- `/fix-issue` - Analyze GitHub issue and implement complete fix
- `/fix-pr` - Address PR reviewer feedback and resolve changes
- `/create-prd` (+ `/prd` alias) - Generate Product Requirements Document

**New Skills:**

- `mcp-builder` - Create MCP servers for API integration

### Changed

- Plugin now includes 42 commands (was 35)
- Plugin now includes 23 agents (was 19)
- Plugin now includes 6 skills (was 5)

### Sources

- [awesome-claude](https://github.com/tonysurfly/awesome-claude)
- [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents)
- [awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code)
- [awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills)

## [1.8.0] - 2026-01-13

### Added

- **Agent Skills System** - 5 auto-invoked skills that Claude uses based on context
  - `api-development` - REST API creation, testing, authentication, rate limiting
  - `frontend-development` - React/Vue/Angular/Svelte components, pages, accessibility
  - `database-operations` - Schema design, migrations, Supabase/Prisma/Drizzle
  - `devops-automation` - CI/CD, Docker, deployment, infrastructure
  - `code-quality` - Code review, testing, refactoring, optimization
- **SKILLS.md** - Documentation for skills vs commands vs agents
- **Skills Directory** - `.claude/skills/` with 5 skill bundles

### Changed

- Removed unsupported "tags" field from plugin.json (schema compliance)
- Plugin description updated to highlight skills feature

### Documentation

- Complete skills guide with usage examples
- Comparison table: Skills vs Commands vs Agents
- Custom skill creation guide

## [1.9.0] - 2026-01-13

### Added

- **Context Management System** - Persistent memory and context optimization
  - `/memory` command - View, update, or manage Claude's persistent project memory
  - `/context` command - Summarize, compact, or load files just-in-time
  - `.claude/memory/MEMORY.md` - Structured memory file with semantic, episodic, and procedural sections

- **Aider-Inspired Features** - High-level design and exploration modes
  - `/architect` command - Architecture discussions without code changes
  - `/ask` command - Ask questions about codebase without modifications
  - `/map` command - Generate codebase structure and dependency maps

- **Cursor-Inspired Features** - Project rules and customization
  - `/rules` command - View, edit, or create project-specific rules
  - `.claude/rules/PROJECT-RULES.md` - Comprehensive rules template (like .cursorrules)

### Changed

- Updated plugin to **41 commands** (was 35)
- Updated all documentation to reflect new features

### Architecture

- New `.claude/memory/` directory for persistent memory
- New `.claude/rules/` directory for project rules
- 6 new command files in `.claude/commands/misc/`

## [1.8.0] - 2026-01-13

### Added

- **Agent Skills System** - 8 auto-activating context-aware skills
  - **API Bundle (3 skills)**:
    - `api-creation` - Auto-applies Next.js 15 patterns, Zod validation, consistent error handling
    - `api-testing` - Generates comprehensive tests with edge cases, error scenarios, integration patterns
    - `api-security` - Applies authentication, rate limiting, input sanitization, OWASP protections
  - **Frontend Bundle (2 skills)**:
    - `component-patterns` - React/Vue/Angular/Svelte best practices, accessibility, performance
    - `state-management` - Guides state decisions between local, context, and global stores
  - **Database Bundle (2 skills)**:
    - `query-optimization` - N+1 prevention, indexing suggestions, efficient data fetching
    - `migration-safety` - Safe, reversible migrations with zero-downtime patterns
  - **DevOps Bundle (1 skill)**:
    - `ci-cd-patterns` - GitHub Actions best practices, testing pipelines, deployment workflows

- **Multi-Agent Orchestrators** - 3 workflow orchestrators for complex tasks
  - `fullstack-feature-workflow` - End-to-end feature implementation
    - Planning stage (requirements-analyst → system-architect)
    - Build stage (api-architect + frontend-architect in parallel)
    - Verify stage (test-strategist → code-reviewer → technical-writer)
  - `code-review-workflow` - Multi-perspective code review
    - Parallel execution: security-engineer, performance-engineer, code-reviewer, accessibility-auditor
    - Aggregated scoring system (A-F grades, weighted by category)
    - Unified report with action items
  - `refactoring-workflow` - Safe, systematic refactoring
    - Analysis stage (code-reviewer + performance-profiler)
    - Planning stage (refactoring-expert + system-architect)
    - Execution stage (incremental changes with test verification)
    - Verification stage (test-strategist + code-reviewer)

- **Research Documentation** - `.claude/docs/AGENT-SKILLS-RESEARCH.md`
  - Comprehensive comparison of Skills vs Commands vs Agents
  - SKILL.md format specification
  - Progressive disclosure patterns
  - Agent scoring algorithms
  - Implementation roadmap

### Changed

- Updated plugin version to 1.8.0
- Updated plugin description to include skills and orchestrators
- Added `skills`, `orchestrators`, `multi-agent` tags to plugin.json
- Updated [CLAUDE.md](CLAUDE.md) with Skills and Orchestrators documentation
- Updated [README.md](README.md) with new features section

### Architecture

- New `.claude/skills/` directory structure (api/, frontend/, database/, devops/)
- New `.claude/orchestrators/` directory for workflow definitions
- New `.claude/docs/` directory for research and design documents
- Skills use priority-based activation (higher priority checked first)
- Orchestrators define multi-stage workflows with agent handoff protocols

## [1.7.2] - 2026-01-13

### Added

- **Command Template Test Suite** (`scripts/test-commands.js`) - Comprehensive automated testing for command markdown files
  - Validates frontmatter structure and required fields
  - Checks for $ARGUMENTS placeholders
  - Tests content structure and quality
  - Validates model assignments
  - Quality checks for TODO markers, broken links, and formatting

### Fixed

- Fixed missing `description` field in [code-explain.md](.claude/commands/misc/code-explain.md)

### Testing

- Added automated command template validation
- 102 test assertions passing across 22 command files
- Validates command structure, frontmatter, placeholders, and quality

## [1.7.1] - 2026-01-13

### Documentation

- Comprehensive documentation overhaul
- Updated README.md to accurately reflect 35 commands and 19 agents
- Updated CLAUDE.md to include hooks system and MCP servers
- Documented all command aliases throughout documentation
- Added Automation Hooks section to README.md
- Updated MCP server counts and descriptions

## [1.7.0] - 2026-01-12

### Added

- **Hooks & Automation System** - 6 pre-configured hook scripts for workflow automation
  - `block-sensitive-files.sh` - PreToolUse hook to prevent edits to .env, credentials, secrets
  - `auto-format.sh` - PostToolUse hook for auto-formatting with prettier/eslint/biome
  - `typecheck.sh` - PostToolUse hook for TypeScript type-checking after edits
  - `validate-json.sh` - PreToolUse hook to validate JSON syntax before writing
  - `auto-commit.sh` - Stop hook for automatic git commits with descriptive messages
  - `notify-completion.sh` - Stop hook for desktop notifications (macOS/Linux/Windows)
- **HOOKS.md** - Comprehensive documentation for hooks configuration and usage
- **Updated settings.template.json** - Now includes full hooks configuration

### Changed

- Plugin description now highlights hooks as a key feature
- Added "hooks" and "automation" tags to plugin.json

### Documentation

- Complete hooks reference with configuration examples
- Custom hook creation guide
- Troubleshooting section for common hook issues

## [1.6.0] - 2026-01-12

### Added

- **code-reviewer** agent - Multi-aspect code review covering security, performance, quality, and maintainability with severity scoring
- **test-strategist** agent - Plan comprehensive testing strategies, analyze coverage gaps, and design test architectures
- **migration-planner** agent - Plan safe database schema migrations with zero-downtime strategies and rollback procedures
- **accessibility-auditor** agent - Audit web applications for WCAG 2.1 compliance with detailed remediation guidance
- **performance-profiler** agent - Profile application performance, analyze Core Web Vitals, and identify optimization opportunities

### Changed

- Updated plugin to 19 agents total (was 14)
- Added STEROIDS roadmap to TODO.md with 50+ research-based improvements

### Research

- Hooks & Automation patterns from Claude Code Hooks Guide
- Agent Skills System from official documentation
- MCP Server expansion research (Notion, Linear, GitHub, MongoDB, AWS, etc.)
- Multi-agent orchestration patterns
- Context management techniques from Anthropic engineering blog
- Aider and Cursor feature analysis

## [1.5.1] - 2026-01-12

### Added

- **Wizard command** (`/wizard`) - Interactive guide to choose commands and build specifications
- **Interactive options tables** - Added to `/component-new`, `/test-new`, `/migration-new` to prompt for preferences

### Changed

- Updated plugin to 35 commands (22 unique + 13 aliases)
- Commands now prompt for clarification when options are unclear

## [1.5.0] - 2026-01-12

### Added

- **Vue 3 component command** (`/component-vue`) - Create Vue 3 components with Composition API and TypeScript
- **Angular component command** (`/component-angular`) - Create Angular 17+ standalone components with signals
- **Svelte 5 component command** (`/component-svelte`) - Create Svelte 5 components with runes
- **Plugin settings system** (`plugin-settings.json`) - User preferences for framework, styling, testing, deployment
- **13 command aliases** for shorter command invocation (e.g., `/api` → `/api-new`)

### Changed

- Updated plugin to 34 commands total (21 unique + 13 aliases)
- Plugin now supports Vue, Angular, and Svelte in addition to React/Next.js
- API commands now include "Next Steps" suggestions for command chaining

### Research & Documentation

- **Alternative approaches research** ([RESEARCH-alternative-approaches.md](.claude/docs/RESEARCH-alternative-approaches.md)) exploring:
  - Command composition patterns (workflow commands, suggestions, compound arguments)
  - Plugin extension system for community commands
  - Stack presets for Vue/Nuxt, Angular, SvelteKit, Remix
  - Agent specialization based on project type detection
- **Project detection script** (`scripts/detect-project.js`) - Detects framework, database, testing, styling, and state management

## [1.4.0] - 2026-01-12

### Added

- **Stripe MCP server** (`@stripe/mcp`) - Payment processing and Stripe API operations
- **Chrome DevTools MCP server** (`chrome-devtools-mcp`) - Browser debugging and performance analysis
- **Vercel MCP server** (`@vercel/mcp`) - Deployment management and project operations
- GitHub Actions CI workflow for automated validation (JSON syntax, path verification, frontmatter checks)
- Pre-commit hooks configuration (`.pre-commit-config.yaml`) for local quality checks
- Markdownlint configuration (`.markdownlint.json`) for consistent markdown formatting
- Example project template (`examples/nextjs-starter/`) with workflow demonstrations
- Plugin validation script (`scripts/validate-plugin.js`) for comprehensive checks
- Agent quality test suite (`scripts/test-agents.js`) for prompt validation

### Changed

- Updated plugin to 6 MCP servers total (was 3)
- Enhanced MCP-SERVERS.md with comprehensive documentation for all 6 servers
- CI workflow now includes test script execution

## [1.3.0] - 2026-01-12

### Added

- **database-architect** agent - Design optimal database schemas with focus on scalability, performance, and data integrity
- **devops-engineer** agent - Design CI/CD pipelines, infrastructure as code, and deployment strategies
- **api-architect** agent - Design RESTful and GraphQL APIs with focus on consistency and developer experience
- MCP server environment variable configuration documentation in MCP-SERVERS.md

### Changed

- Updated plugin to 14 agents total (was 11)
- Improved CLAUDE.md with concise development guidance

### Fixed

- Registered previously unregistered database-architect agent in plugin.json

## [1.2.0] - 2025-01-12

### Added

- `/deploy` command - Generate deployment configurations and CI/CD workflows for Vercel, Netlify, AWS, Docker
- Comprehensive troubleshooting section in README with 6 common issue categories and solutions

### Changed

- Updated all command models from `claude-sonnet-4-5` to `claude-opus-4-5` for improved performance
- Updated license from MIT to GPL-3.0 to ensure derivatives remain open source
- Updated plugin description to reflect 18 commands (was 17)

### Improved

- Enhanced deployment workflow documentation with multiple platform support
- Better error handling guidance in troubleshooting section
- Consistent model usage across all commands for better reliability

## [1.1.0] - 2025-01-12

### Added

- `/test-new` command - Generate test files for Jest, Vitest, or Playwright with comprehensive test patterns
- `/migration-new` command - Create database migration files with support for Prisma, Drizzle, Supabase, Knex
- `/hook-new` command - Create custom React hooks with TypeScript and modern patterns

### Changed

- Generalized tech-stack-researcher agent to be framework-agnostic (removed app-specific references)
- Updated plugin description to reflect 17 commands (was 14)

### Improved

- Better support for multiple testing frameworks and ORMs
- Enhanced TypeScript patterns in generated code
- Comprehensive best practices documentation in new commands

## [1.0.0] - 2025-01-12

### Added

- Initial release of lorenzos-claude-code plugin
- 14 slash commands for development workflows:
  - 7 general development commands (`/new-task`, `/code-explain`, `/code-optimize`, `/code-cleanup`, `/feature-plan`, `/lint`, `/docs-generate`)
  - 3 API commands (`/api-new`, `/api-test`, `/api-protect`)
  - 2 UI commands (`/component-new`, `/page-new`)
  - 2 Supabase commands (`/types-gen`, `/edge-function-new`)
- 11 specialized AI agents:
  - Architecture & Planning: tech-stack-researcher, system-architect, backend-architect, frontend-architect, requirements-analyst
  - Code Quality: refactoring-expert, performance-engineer, security-engineer
  - Documentation: technical-writer, learning-guide, deep-research-agent
- 3 pre-configured MCP servers:
  - Context7 for library documentation
  - Playwright for browser automation
  - Supabase for database operations
- Comprehensive documentation (README.md, CLAUDE.md, PUBLISHING.md, QUICK-START.md)
- MIT License

### Philosophy

- Type Safety: Never uses `any` types
- Best Practices: Follows modern Next.js/React patterns
- Productivity: Reduces repetitive scaffolding
- Research: AI-powered tech decisions with evidence

---

## Future Releases

Changes will be documented here as new versions are released.

### Version Guidelines

- **MAJOR** (X.0.0) - Breaking changes or major restructuring
- **MINOR** (x.Y.0) - New commands, agents, or significant features
- **PATCH** (x.y.Z) - Bug fixes, documentation updates, minor improvements
