# Make the plugin installable end-to-end, and document it

**Date:** 2026-08-19
**Status:** Approved
**Repo:** `gr8monk3ys/skills` (local `~/code/skills`)
**Reference:** [mattpocock/skills](https://github.com/mattpocock/skills) (local clone `~/code/mattpocock-skills`), and the installed `superpowers` plugin at `~/.claude/plugins/cache/claude-plugins-official/superpowers/6.3.0/`.

## Problem

The plugin cannot be installed by anyone via `/plugin install`. Four independent defects, each verified against the current `main` (`a687a7d`):

1. **Invalid manifest shape.** `.claude-plugin/plugin.json` declares `commands`, `agents`, and `skills` as arrays of objects (`{name, path, description}`). The plugin schema requires arrays of **path strings**. `claude plugin validate .` reports three errors: `commands: Invalid input`, `agents: Invalid input`, `skills: Invalid input`.
2. **Payload is not at the plugin root.** All primitives live under `.claude/`. Claude Code discovers plugin components from the plugin root.
3. **Hooks use CWD-relative paths.** Every entry in `.claude/hooks/hooks.json` is of the form `node ./.claude/hooks/<name>.js`. Once installed, the working directory is the *user's* project, so all 14 hooks fail to resolve.
4. **Hooks are never discovered anyway.** `plugin.json` declares no `hooks` field; hooks are found by convention at `<plugin-root>/hooks/hooks.json`, which does not exist.

Fixing only (1) yields a green validator and a still-broken plugin, which is why this is a layout change and not a manifest tweak.

### Verified experiment

In a throwaway `git worktree` off `main`, rewriting the three arrays as path strings removed all three errors. Additionally removing the four unknown fields — `npm` and `profiles` from `plugin.json`, `features` and `highlights` from `marketplace.json`'s plugin entry — produced:

```
✔ Validation passed
```

`--strict` treats warnings as errors, so the unknown fields must go for a strict pass. The worktree was removed; `main` is untouched.

### Incidental defects found while diagnosing

- `.claude/settings.json` and `.claude/settings.template.json` register four hooks as **`.sh` files** (`block-sensitive-files.sh`, `validate-json.sh`, `auto-format.sh`, `typecheck.sh`). No `.sh` file exists in `.claude/hooks/` — the real hooks are `.js`, registered via `hooks.json`. This is dead configuration; `typecheck` has no `.js` counterpart at all.
- `.claude/hooks/session-start.js:110` reads `.claude/memory.json` relative to CWD. For an installed plugin that resolves to the *user's* project, which is the intended behaviour (project-local memory). **Leave as-is.**
- `.claude/hooks/post-tool-failure.js:8` mentions `~/.claude/logs/failures.json` in a comment — home-relative, correct for a plugin. **Leave as-is.**

## Current inventory (must be preserved exactly)

17 commands · 6 agents · 14 skills · 14 hook `.js` files · 2 monitors.

---

# Phase 1 — Installability

Ships first, as its own PR. The repo is unusable by others until this lands.

## 1.1 Layout: move the plugin primitives to the root

The four Claude Code plugin primitives move from `.claude/` to the repo root:

```
skills/<bucket>/<name>/SKILL.md     (was .claude/skills/...)
commands/<category>/<name>.md       (was .claude/commands/...)
agents/<name>.md                    (was .claude/agents/...)
hooks/<name>.js + hooks.json + skill-rules.json   (was .claude/hooks/...)
```

`.claude/` retains only what is this repo's own configuration and non-primitive extras: `settings.json`, `settings.template.json`, `plugin-settings.json`, `plugin-settings.schema.json`, `rules/`, `memory/`, `monitors/`, `profiles/`, `scripts/`, `docs/`, `handoffs/`, `logs/`.

The resulting split is meaningful and should be stated in `CONTEXT.md`: **repo root = what ships to users; `.claude/` = how this repo itself runs.**

This mirrors both reference plugins: `superpowers` ships `skills/` and `hooks/` at its root, and `mattpocock/skills` ships `skills/<bucket>/<name>/` at its root.

## 1.2 Manifest: emit path strings

`scripts/sync-manifest.js` and `scripts/lib/manifest.js` change what they emit into `plugin.json`:

- `skills`: **directory** paths, e.g. `"./skills/engineering/wizard"` (no `/SKILL.md` suffix) — matching mattpocock's manifest.
- `commands`: **file** paths, e.g. `"./commands/nextjs/api-new.md"`.
- `agents`: **file** paths, e.g. `"./agents/code-reviewer.md"`.

Skills stay explicitly declared. Convention-based discovery finds `skills/<name>/SKILL.md` only one level deep, and ours are bucketed two levels deep; this is precisely why mattpocock declares his explicitly rather than relying on convention.

The name and description that the arrays currently carry are still needed for the README/CLAUDE.md AUTOGEN tables, so the scanners keep returning full objects internally. Only the *serialisation into plugin.json* changes to strings.

### Fields to remove

| File | Field | Disposition |
|---|---|---|
| `plugin.json` | `npm` | Remove. The npm package name already lives in `package.json` and the README. |
| `plugin.json` | `profiles` | Remove the manifest field. `.claude/profiles/mcp-minimal.json` stays on disk and is documented in the README; nothing in the codebase reads the manifest field. |
| `marketplace.json` plugin entry | `features` | Remove. The counts survive in the `description` prefix, which the sync already regenerates. |
| `marketplace.json` plugin entry | `highlights` | Remove. Its content moves into the README. |
| `marketplace.json` plugin entry | `npm` | Remove. |

Removing `features` does **not** undo the drift protection added in PR #39: `updateMarketplaceJson` continues to regenerate the count prefix inside `description`, and its unit test is retargeted to that field.

## 1.3 Hooks

- Rewrite every command in `hooks/hooks.json` from `node ./.claude/hooks/<name>.js` to `node "${CLAUDE_PLUGIN_ROOT}/hooks/<name>.js"`.
- Update `.claude/settings.json` and `.claude/settings.template.json` so this repo's own hook registrations point at the new root `hooks/` location, and **delete the four dead `.sh` registrations** (no such files exist).
- Leave `session-start.js`'s `.claude/memory.json` read and `post-tool-failure.js`'s `~/.claude/logs` comment unchanged, per the analysis above.

## 1.4 Consumers to update

- `scripts/sync-manifest.js` — scan roots (`commands`, `agents`, `skills`, `hooks`) and the string serialisation.
- `scripts/lib/manifest.js` — `PROMOTED_BUCKETS` stays the single source of truth; `scanSkills`'s base directory becomes `skills/`.
- `bin/cli.js` — `install()` copies from the new root directories; `uninstall()` and `doctor()` follow. The promoted-bucket flattening behaviour is unchanged.
- `package.json` `files` — add the four root directories (`commands/`, `agents/`, `skills/`, `hooks/`). `.claude/` must still ship the directories `lcc install` copies, which are `rules/`, `memory/`, and `profiles/` (confirmed against `componentsToCopy` in `bin/cli.js`), plus `monitors/` because the sync counts it. List those four subdirectories explicitly rather than shipping all of `.claude/` — the repo's own `settings.json`, `logs/`, and `handoffs/` should not reach users. Verify with `npm pack --dry-run` that every previously-shipped file is still present.
- `tests/run-all.js` and `tests/manifest-sync.test.js` — path expectations and fixtures.
- `.mcp.json` — two `_documentation` strings reference `.claude/profiles/` and `.claude/docs/`; both stay in place, so **no change required**. Verify at implementation time.

## 1.5 Verification — the actual gate

Validation passing is not evidence of a working install. Phase 1 is complete only when a real install reports a real inventory.

1. `claude plugin validate . --strict` → `✔ Validation passed`.
2. `npm run sync:check` clean; `npm test` green (note: `node --test tests/` is broken on this machine's Node v26 — use `npm test`).
3. **Install test.** Add the local repo as a marketplace, install the plugin, and run `claude plugin details lorenzos-claude-code`. It must report **17 commands, 6 agents, 14 skills**, and a non-zero hook count. Record the exact hook figure it prints: `hooks.json` groups the 14 scripts across events, so the tool's count may legitimately differ from 14 — what matters is that it is not zero, which is today's effective value. Then uninstall and remove the marketplace.
   - Attempt this hermetically first by pointing `CLAUDE_CONFIG_DIR` at a temporary directory, so the user's real Claude configuration is untouched.
   - If `CLAUDE_CONFIG_DIR` is not honoured, **stop and ask the user** before modifying their real config. Do not skip the step silently — an unverified install is the exact failure this phase exists to fix.
4. `lcc install` into a temporary `HOME` still yields 14 flattened skill directories with no `misc`, and `lcc doctor` passes.
5. `npm pack --dry-run` still includes every `SKILL.md` and `LICENSES/mattpocock-skills-MIT.txt`.

## 1.6 Risk

This is a large mechanical diff — every skill, command, agent, and hook file changes path. The review question is "did anything get lost", answered by the count assertions in 1.5 and by `git log --follow` showing renames rather than delete/add pairs where possible. Use `git mv` so history is preserved.

---

# Phase 2 — Documentation

Second PR, after Phase 1 is merged and proven.

## 2.1 Per-skill docs pages

A page at `docs/<bucket>/<skill-name>.md` for each of the **14 promoted skills**, mirroring the two promoted bucket folders. Non-promoted skills (`misc/`) get no page — the same promoted/non-promoted rule the manifest already enforces.

Structure, adapted from mattpocock's `.agents/writing-docs.md`:

- `## What it does` — one or two plain-language paragraphs. Lead with the skill's one-sentence job, then state the **defining constraint**: the single fact that makes it behave differently from the obvious default. Written as a plain declarative sentence, never as a labelled aside.
- `## When to reach for it` — two beats: **invocation mode** (user-invoked skills say "you invoke this by typing `/<name>` — the agent won't reach for it on its own"; model-invoked say "type `/<name>`, or the agent reaches for it automatically when a task fits"), and the **trigger boundary** ("reach for this when …", plus the sibling it is confusable with).
- `## Prerequisites` — optional; include only when the skill needs setup or writes into a workspace. Omit the heading entirely otherwise.
- A free-form middle of one to three short sections in the skill's own vocabulary.
- `## Common questions` — the questions a reader actually arrives with.
- `## It's working if` — observable signs the skill is doing its job.

**Deliberate deviation from the source guide:** mattpocock's pages use absolute URLs because they are published to `aihero.dev`. Ours render on GitHub, so **links are repo-relative**. This must be stated in our copy of the guide so the two do not silently diverge.

There is no H1 in his pages because the publishing template supplies one. Ours render as standalone GitHub files, so **each page starts with an H1 naming the skill.**

## 2.2 The mechanism, not just the output

Port an adapted `.agents/writing-docs.md` into this repo (path: `.agents/writing-docs.md`) carrying the template, the section order, and the deviations above. Add a rule to `CLAUDE.md`: adding, renaming, or changing the behaviour of a promoted skill requires creating or re-syncing its docs page, exactly as the existing rule requires re-syncing `ask-lorenzo`.

## 2.3 README rewrite

Restructure on the problem→fix spine the reference README uses, with our own content:

- A short statement of what the plugin is and what it composes with.
- **Install** — the three routes, each in its own collapsed block: the Claude Code marketplace (`/plugin marketplace add gr8monk3ys/skills` then `/plugin install lorenzos-claude-code`), `npx skills@latest add gr8monk3ys/skills`, and `npm install -g @gr8monk3ys/claude-code-plugin && lcc install`. **An explicit warning that installing by more than one route leaves you with every skill twice.**
- **Why these exist** — two or three problem→fix sections naming the failure mode and the command or skill that addresses it.
- **Reference** — the existing AUTOGEN command/agent/skill tables, with the skills split into **User-invoked** and **Model-invoked**, each name linking to its docs page.

The existing hero image and the AUTOGEN markers are preserved; the AUTOGEN blocks must keep working, so hand-written prose stays outside them.

## 2.4 Scope limits

No docs pages for the 17 commands — the README table covers them. No GitHub Pages site. No changes to versioning or releases.

## 2.5 Verification

- Every promoted skill has a page; no non-promoted skill does. Assert this in `tests/run-all.js` so a missing page fails the build rather than going unnoticed.
- Every relative link in `docs/` resolves to a file that exists.
- `npm run sync:check` clean — the README rewrite must not disturb the AUTOGEN blocks.

---

## Out of scope for both phases

- Release PR #38 (`chore(main): release 1.0.0`) remains untouched. It proposes a version *lower* than the published 4.1.0 because release-please has no manifest and finds no `claude-code-plugin-v*` tag. It is a separate decision and must not be entangled with this work.
- The `lcc install` upgrade path leaving pre-bucket flat `.md` files in `~/.claude/skills`.
- Any change to the plugin name `lorenzos-claude-code` or the npm package `@gr8monk3ys/claude-code-plugin`.
