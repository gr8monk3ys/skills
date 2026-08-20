# Phase 1 — Installability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `gr8monk3ys/skills` installable by anyone via `/plugin install`, proven by a real install reporting a real component inventory.

**Architecture:** Move the four Claude Code plugin primitives (`commands/`, `agents/`, `skills/`, `hooks/`) from `.claude/` to the repo root so convention-based discovery finds them; change the manifest generator to emit path strings instead of objects; drop the four unknown manifest fields so `--strict` passes; repoint hook commands at `${CLAUDE_PLUGIN_ROOT}`. `.claude/` keeps only this repo's own configuration.

**Tech Stack:** Node 18+ (CommonJS, `node:test`, no runtime deps), `claude` CLI, `gh`, bash.

**Spec:** `docs/superpowers/specs/2026-08-19-installable-e2e-and-docs-design.md`

## Global Constraints

- Inventory must be preserved exactly: **17 commands · 6 agents · 14 skills · 14 hook `.js` files · 2 monitors**. Any task whose count check disagrees must STOP, not adjust the check.
- Promoted buckets remain exactly `engineering` and `productivity`, from the single exported `PROMOTED_BUCKETS` in `scripts/lib/manifest.js`. `misc/` never ships.
- The plugin name `lorenzos-claude-code` and npm package `@gr8monk3ys/claude-code-plugin` do not change anywhere.
- Use `git mv` for every file move so rename history is preserved.
- `node --test tests/` is BROKEN on this machine's Node v26 (misparses a bare directory arg). Always use `npm test`.
- Style: `scripts/` and `tests/` use single quotes, no semicolons. `bin/cli.js` uses double quotes and semicolons. Match the file being edited.
- Every commit message ends with the line: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`
- Never open a draft PR. Never arm auto-merge. Do not merge.
- Do not touch release PR #38, the `package.json` version, or anything in the spec's "Out of scope" list.

---

### Task 1: Move the four plugin primitives to the repo root

**Files:**

- Move: `.claude/commands/` → `commands/` (9 category dirs: api, devops, generation, nextjs, quality, supabase, testing, ui, workflow)
- Move: `.claude/agents/` → `agents/`
- Move: `.claude/skills/` → `skills/`
- Move: `.claude/hooks/` → `hooks/`

**Interfaces:**

- Produces: primitives at repo root. Later tasks point every consumer at these paths. `.claude/` retains `settings.json`, `settings.template.json`, `plugin-settings.json`, `plugin-settings.schema.json`, `rules/`, `memory/`, `monitors/`, `profiles/`, `scripts/`, `docs/`, `handoffs/`, `logs/`.

- [ ] **Step 1: Create the feature branch, then record the pre-move inventory**

Every commit in this plan lands on `feat/installable-e2e`. Create it first — committing to `main` is a plan violation.

```bash
cd /Users/natalyscaturchio/code/skills
git checkout -b feat/installable-e2e
git rev-parse --abbrev-ref HEAD   # must print feat/installable-e2e
echo "commands: $(find .claude/commands -name '*.md' | wc -l)"
echo "agents:   $(find .claude/agents -name '*.md' | wc -l)"
echo "skills:   $(find .claude/skills -name 'SKILL.md' | wc -l)"
echo "hookjs:   $(ls .claude/hooks/*.js | wc -l)"
```

Expected: `17`, `6`, `20` (14 promoted + 6 in `misc/`), `14`. Write these numbers into your report; Step 3 re-checks them.

- [ ] **Step 2: Move with git mv**

```bash
git mv .claude/commands commands
git mv .claude/agents agents
git mv .claude/skills skills
git mv .claude/hooks hooks
```

- [ ] **Step 3: Verify nothing was lost and renames were detected**

```bash
echo "commands: $(find commands -name '*.md' | wc -l)"
echo "agents:   $(find agents -name '*.md' | wc -l)"
echo "skills:   $(find skills -name 'SKILL.md' | wc -l)"
echo "hookjs:   $(ls hooks/*.js | wc -l)"
git status --porcelain | grep -c '^R'
```

Expected: same four numbers as Step 1, and a non-zero rename count. If any count differs, STOP and report.

- [ ] **Step 4: Commit**

The manifest is now stale and `npm run sync:check` will fail — that is expected and Task 2 repairs it. Commit with `--no-verify` for this task only.

```bash
git add -A
git commit --no-verify -m "refactor: move plugin primitives to repo root for plugin discovery

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 2: Scan the new roots and emit path strings (TDD)

**Files:**

- Modify: `scripts/sync-manifest.js` (the five `scanX` calls)
- Modify: `scripts/lib/manifest.js` (`buildPluginJson`, add `toPluginPath`, export it)
- Test: `tests/manifest-sync.test.js`

**Interfaces:**

- Produces: `toPluginPath(repoRoot, filePath, opts)` → string, exported from `scripts/lib/manifest.js`. `buildPluginJson` returns `commands`/`agents`/`skills` as arrays of strings. Task 3 depends on this shape; Task 5 depends on the root directory names.

- [ ] **Step 1: Write the failing tests** (append to `tests/manifest-sync.test.js`)

```js
test('toPluginPath returns a ./-prefixed repo-relative path', () => {
  const p = manifest.toPluginPath('/repo', '/repo/commands/nextjs/api-new.md')
  assert.equal(p, './commands/nextjs/api-new.md')
})

test('toPluginPath strips the SKILL.md suffix for skills', () => {
  const p = manifest.toPluginPath('/repo', '/repo/skills/engineering/wizard/SKILL.md', { stripSkillFile: true })
  assert.equal(p, './skills/engineering/wizard')
})

test('buildPluginJson emits path strings, not objects', () => {
  const next = manifest.buildPluginJson({
    base: { name: 'p' },
    version: '1.0.0',
    commands: [{ name: 'c', description: 'd', path: '/repo/commands/api/c.md' }],
    agents: [{ name: 'a', description: 'd', path: '/repo/agents/a.md' }],
    skills: [{ name: 's', description: 'd', path: '/repo/skills/engineering/s/SKILL.md' }],
    repoRoot: '/repo',
  })
  assert.deepEqual(next.commands, ['./commands/api/c.md'])
  assert.deepEqual(next.agents, ['./agents/a.md'])
  assert.deepEqual(next.skills, ['./skills/engineering/s'])
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test`
Expected: FAIL — `manifest.toPluginPath is not a function`.

- [ ] **Step 3: Implement `toPluginPath` in `scripts/lib/manifest.js`**

Add above `buildPluginJson`, and add `toPluginPath` to `module.exports`:

```js
function toPluginPath(repoRoot, filePath, { stripSkillFile = false } = {}) {
  let rel = path.relative(repoRoot, filePath).split(path.sep).join('/')
  if (stripSkillFile) rel = rel.replace(/\/SKILL\.md$/, '')
  return './' + rel
}
```

- [ ] **Step 4: Rewrite `buildPluginJson` in `scripts/lib/manifest.js`**

Replace the whole function (the old `toEntry` helper goes away):

```js
function buildPluginJson({ base, version, commands, agents, skills, repoRoot }) {
  return {
    ...base,
    version,
    commands: commands.map(i => toPluginPath(repoRoot, i.path)),
    agents: agents.map(i => toPluginPath(repoRoot, i.path)),
    skills: skills.map(i => toPluginPath(repoRoot, i.path, { stripSkillFile: true })),
  }
}
```

- [ ] **Step 5: Point the scanners at the new roots**

In `scripts/sync-manifest.js`, replace the five scan lines:

```js
  const commands = m.scanCategory(path.join(REPO_ROOT, 'commands'))
  const agents = m.scanCategory(path.join(REPO_ROOT, 'agents'))
  const skills = m.scanSkills(path.join(REPO_ROOT, 'skills'), PROMOTED)
  const hooks = m.scanHooks(path.join(REPO_ROOT, 'hooks'))
  const monitors = m.scanMonitors(path.join(REPO_ROOT, '.claude/monitors'))
```

Note `monitors` still points at `.claude/monitors` — monitors are not a plugin primitive and do not move.

- [ ] **Step 6: Fix the pre-existing buildPluginJson test**

The existing test named `buildPluginJson assembles a manifest with arrays and preserves mcpServers` asserts the old object shape. Update its assertions to expect strings, keeping its `mcpServers` preservation check intact.

- [ ] **Step 7: Sync and verify**

```bash
npm run sync
npm test
python3 -c "
import json; d=json.load(open('.claude-plugin/plugin.json'))
assert len(d['commands'])==17 and len(d['agents'])==6 and len(d['skills'])==14, (len(d['commands']),len(d['agents']),len(d['skills']))
assert all(isinstance(x,str) for x in d['commands']+d['agents']+d['skills']), 'non-string entry'
assert d['skills'][0].startswith('./skills/'), d['skills'][0]
assert not any('/misc/' in x for x in d['skills']), 'misc leaked'
print('manifest OK:', d['skills'][0], '|', d['commands'][0])
"
npm run sync:check
```

Expected: tests green, `manifest OK: ...`, `sync:check` exit 0.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scan root primitives and emit plugin.json path strings

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 3: Drop the unknown manifest fields so `--strict` passes

**Files:**

- Modify: `scripts/sync-manifest.js` (the `base` object)
- Modify: `scripts/lib/manifest.js` (`updateMarketplaceJson`)
- Modify: `.claude-plugin/marketplace.json` (remove three keys from the plugin entry)
- Test: `tests/manifest-sync.test.js`

**Interfaces:**

- Consumes: string-emitting `buildPluginJson` from Task 2.
- Produces: `claude plugin validate . --strict` passing. Task 6 re-asserts this.

- [ ] **Step 1: Write the failing test** (append to `tests/manifest-sync.test.js`)

```js
test('updateMarketplaceJson rewrites the count prefix and leaves no features block', () => {
  const parsed = { plugins: [{ name: 'p', description: '1 commands, 1 agents, 1 skills, 1 hooks, 1 monitors. Tail text.' }] }
  const next = manifest.updateMarketplaceJson(parsed, { commands: 17, agents: 6, skills: 14, hooks: 14, monitors: 2 })
  assert.equal(next.plugins[0].description, '17 commands, 6 agents, 14 skills, 14 hooks, 2 monitors. Tail text.')
  assert.ok(!('features' in next.plugins[0]), 'features must not be reintroduced')
})
```

- [ ] **Step 2: Run to verify it fails or passes for the wrong reason**

Run: `npm test`
Expected: the older test named `updateMarketplaceJson rewrites the count prefix and features, preserving key order and other fields` still references a `features` block. Delete that older test and keep the new one — the field it asserts is being removed.

- [ ] **Step 3: Simplify `updateMarketplaceJson` in `scripts/lib/manifest.js`**

Replace the whole function; the `plugin.features` branch is removed:

```js
function updateMarketplaceJson(parsed, counts) {
  const { commands, agents, skills, hooks, monitors } = counts
  const next = JSON.parse(JSON.stringify(parsed))
  const countPrefix = `${commands} commands, ${agents} agents, ${skills} skills, ${hooks} hooks, ${monitors} monitors`
  for (const plugin of Array.isArray(next.plugins) ? next.plugins : []) {
    if (typeof plugin.description === 'string') {
      plugin.description = plugin.description.replace(
        /^\d+ commands, \d+ agents, \d+ skills, \d+ hooks, \d+ monitors\b/,
        countPrefix
      )
    }
  }
  return next
}
```

- [ ] **Step 4: Remove `npm` and `profiles` from the generated plugin.json**

In `scripts/sync-manifest.js`, inside the `base:` object passed to `m.buildPluginJson`, delete these two lines:

```js
      npm: basePlugin.npm,
      profiles: basePlugin.profiles,
```

Leave `mcpServers` and every other base field untouched.

- [ ] **Step 5: Remove the three unknown keys from marketplace.json**

Delete `features`, `highlights`, and `npm` from the single entry in `.claude-plugin/marketplace.json` `plugins[0]`. Keep `author`, `description`, `name`, `source`, `tags`, and `version`. Preserve the file's existing key order and 2-space indentation.

- [ ] **Step 6: Sync, validate, verify**

```bash
npm run sync
npm test
npm run sync:check
claude plugin validate . --strict
```

Expected: `✔ Validation passed` with no errors and no warnings. If any warning remains, name the field it reports and remove that field too, then re-run.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix: drop manifest fields Claude Code ignores so --strict validates

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 4: Repoint hooks at the plugin root, and delete dead settings

**Files:**

- Modify: `hooks/hooks.json` (every `command` value)
- Modify: `.claude/settings.json`, `.claude/settings.template.json`

**Interfaces:**

- Consumes: `hooks/` at the repo root from Task 1.
- Produces: hook commands resolvable when installed. Task 6's install test surfaces the hook count.

- [ ] **Step 1: Rewrite the hook commands**

Every entry in `hooks/hooks.json` currently reads `node ./.claude/hooks/<name>.js`. Rewrite each to:

```
node "${CLAUDE_PLUGIN_ROOT}/hooks/<name>.js"
```

Keep the surrounding `event`, `matcher`, and `description` fields exactly as they are. Apply it to all entries.

- [ ] **Step 2: Verify every command was converted**

```bash
grep -c 'CLAUDE_PLUGIN_ROOT' hooks/hooks.json
grep -c '\.claude/hooks' hooks/hooks.json || echo "0 stale refs (grep found none)"
python3 -c "
import json; d=json.load(open('hooks/hooks.json'))
cmds=[h['command'] for h in d['hooks']]
assert all('CLAUDE_PLUGIN_ROOT' in c for c in cmds), [c for c in cmds if 'CLAUDE_PLUGIN_ROOT' not in c]
missing=[c for c in cmds if not __import__('os').path.exists(c.split('}/')[1].strip('\"'))]
assert not missing, missing
print(len(cmds),'hook commands, all repointed, all target files exist')
"
```

Expected: the count printed, zero stale `.claude/hooks` references, and no missing target file.

- [ ] **Step 3: Fix this repo's own hook registrations**

In `.claude/settings.json` and `.claude/settings.template.json`, the registered commands are `.claude/hooks/block-sensitive-files.sh`, `.claude/hooks/validate-json.sh`, `.claude/hooks/auto-format.sh`, and `.claude/hooks/typecheck.sh`. **No `.sh` file has ever existed in that directory** — these are dead registrations.

Delete all four dead `.sh` registrations from both files. Do NOT convert them to `.js` paths: `hooks/hooks.json` is the real registration mechanism and already covers `block-sensitive-files`, `validate-json`, and `auto-format`; `typecheck` has no implementation at all. Leave every other key in both files untouched, and keep the JSON valid.

- [ ] **Step 4: Verify**

```bash
python3 -m json.tool .claude/settings.json > /dev/null && echo "settings.json valid"
python3 -m json.tool .claude/settings.template.json > /dev/null && echo "template valid"
grep -c '\.sh"' .claude/settings.json .claude/settings.template.json || echo "no .sh registrations remain"
npm test && npm run sync:check
```

Expected: both valid, no `.sh` registrations, tests green.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: resolve hooks from CLAUDE_PLUGIN_ROOT, drop dead .sh registrations

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: Update the npm distribution path (CLI + package files)

**Files:**

- Modify: `bin/cli.js` (`install()` sources, `PROMOTED_BUCKETS` skills loop, `uninstall()`, `doctor()`)
- Modify: `package.json` (`files`)
- Modify: `tests/run-all.js` (path expectations)

**Interfaces:**

- Consumes: root primitives (Task 1), `PROMOTED_BUCKETS` from `scripts/lib/manifest.js`.
- Produces: a working `lcc install`. Task 6 re-runs it as part of the gauntlet.

- [ ] **Step 1: Repoint the CLI's source directories**

`bin/cli.js` computes a `sourceClaude` path used by `componentsToCopy` and by the promoted-buckets skills loop. The four primitives now live at the package root, while `rules`, `memory`, and `profiles` remain under `.claude/`.

Change `componentsToCopy` so `commands`, `agents`, and `hooks` are read from the package root, and `rules`, `memory`, `profiles` continue to come from `.claude/`. Change the skills loop's bucket directory from `path.join(sourceClaude, "skills", bucket)` to the root `skills` directory joined with `bucket`. Keep the flattening behaviour (`~/.claude/skills/<name>/`) and the `misc/` exclusion exactly as they are. Match the file's double-quote, semicolon style.

- [ ] **Step 2: Update `package.json` `files`**

Current value is `["bin/", "scripts/", ".claude/", ".claude-plugin/", "README.md", "LICENSE", "LICENSES/"]`. Replace the blanket `.claude/` with the four root primitive directories plus only the `.claude/` subdirectories that must ship:

```json
  "files": [
    "bin/",
    "scripts/",
    "commands/",
    "agents/",
    "skills/",
    "hooks/",
    ".claude/rules/",
    ".claude/memory/",
    ".claude/profiles/",
    ".claude/monitors/",
    ".claude-plugin/",
    "README.md",
    "LICENSE",
    "LICENSES/"
  ]
```

`rules`, `memory`, and `profiles` are required because `lcc install` copies them; `monitors` because the sync counts them. The repo's own `settings.json`, `logs/`, and `handoffs/` are deliberately excluded.

- [ ] **Step 3: Update the integration test's path expectations**

`tests/run-all.js` walks the skills buckets and checks command/agent/skill counts against `.claude/`-based paths. Repoint it at the root directories. It must keep importing `PROMOTED_BUCKETS` from `scripts/lib/manifest.js` rather than hardcoding bucket names, and keep its existing assertions (17 commands, 6 agents, at least 3 skills).

- [ ] **Step 4: Verify the npm route end to end**

```bash
npm test
TMP=$(mktemp -d) && HOME="$TMP" node bin/cli.js install >/dev/null 2>&1 \
  && echo "installed skills: $(ls "$TMP/.claude/skills" | wc -l)" \
  && [ ! -d "$TMP/.claude/skills/misc" ] && echo "misc excluded" \
  && [ -f "$TMP/.claude/skills/wizard/SKILL.md" ] && echo "wizard present" \
  && [ -d "$TMP/.claude/commands" ] && [ -d "$TMP/.claude/agents" ] && [ -d "$TMP/.claude/hooks" ] && echo "primitives installed" \
  && HOME="$TMP" node bin/cli.js doctor 2>&1 | tail -5
npm pack --dry-run 2>&1 | grep -c "SKILL.md"
npm pack --dry-run 2>&1 | grep -ci "LICENSES/"
```

Expected: `installed skills: 14`, `misc excluded`, `wizard present`, `primitives installed`, doctor without errors, a non-zero SKILL.md count, and a non-zero LICENSES count.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: lcc install and npm package ship root primitives

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: Prove a real install works, then open the PR

**Files:** none modified unless a defect is found.

**Interfaces:**

- Consumes: everything from Tasks 1–5.

- [ ] **Step 1: Hermetic install test — the gate for this whole phase**

`CLAUDE_CONFIG_DIR` is honoured by the `claude` CLI (verified: pointing it at an empty temp directory makes `claude plugin list` report "No plugins installed"), so this test never touches the real config.

```bash
cd /Users/natalyscaturchio/code/skills
export CLAUDE_CONFIG_DIR=$(mktemp -d)
echo "isolated config: $CLAUDE_CONFIG_DIR"
claude plugin list 2>&1 | head -3
claude plugin marketplace add . 2>&1 | tail -3
claude plugin install lorenzos-claude-code 2>&1 | tail -5
claude plugin details lorenzos-claude-code 2>&1 | head -30
```

Expected: the marketplace is added, the plugin installs, and `details` reports a component inventory of **17 commands, 6 agents, 14 skills**, and a **non-zero hook count**. Record the exact hook figure — `hooks.json` groups 14 scripts across events, so the tool's number may legitimately differ from 14; what matters is that it is not zero, which is the current broken value.

If the exact subcommand names or arguments differ on this CLI version, run `claude plugin marketplace --help` and `claude plugin install --help` and adapt, recording what you ran. If `details` reports zero of any primitive, STOP and report BLOCKED with its full output — that is the defect this phase exists to fix, and it is not something to work around.

- [ ] **Step 2: Clean up the isolated config**

```bash
rm -rf "$CLAUDE_CONFIG_DIR"
unset CLAUDE_CONFIG_DIR
claude plugin list 2>&1 | head -3
```

Expected: the real config is intact and unchanged (it lists the user's actual plugins again).

- [ ] **Step 3: Full gauntlet**

```bash
npm run sync:check
npm test
claude plugin validate . --strict
python3 -c "
import json; d=json.load(open('.claude-plugin/plugin.json'))
assert len(d['skills'])==14 and len(d['commands'])==17 and len(d['agents'])==6
assert all(isinstance(x,str) for x in d['skills']+d['commands']+d['agents'])
assert not any('/misc/' in x for x in d['skills'])
assert 'npm' not in d and 'profiles' not in d
print('plugin.json final shape OK')
"
git status --porcelain
```

Expected: all green, `plugin.json final shape OK`, and a clean working tree.

- [ ] **Step 4: Push and open the PR (NOT a draft)**

```bash
git push -u origin feat/installable-e2e
gh pr create --title "fix: make the plugin actually installable via /plugin install" --body "$(cat <<'EOF'
Implements Phase 1 of `docs/superpowers/specs/2026-08-19-installable-e2e-and-docs-design.md`.

The plugin could not be installed by anyone. Four independent defects:

1. `plugin.json` declared `commands`/`agents`/`skills` as arrays of objects; the schema requires path strings.
2. The payload lived under `.claude/`, but plugins are discovered from the plugin root.
3. Every hook command was CWD-relative (`node ./.claude/hooks/x.js`), so installed hooks resolved against the user's project.
4. Hooks are discovered at `<plugin-root>/hooks/hooks.json`, which did not exist.

This moves `commands/`, `agents/`, `skills/`, and `hooks/` to the repo root, emits path strings, drops the four manifest fields Claude Code ignores (so `claude plugin validate --strict` passes), and resolves hooks from `${CLAUDE_PLUGIN_ROOT}`. `.claude/` now holds only this repo's own configuration.

Also removes four dead hook registrations in `.claude/settings.json` that pointed at `.sh` files which have never existed.

Verified by a real install into an isolated `CLAUDE_CONFIG_DIR`: `claude plugin details` reports the full inventory. Inventory unchanged at 17 commands, 6 agents, 14 skills, 14 hooks, 2 monitors.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 5: Report the check status**

Run: `gh pr checks` once (do not use `--watch`, it can block for many minutes). Report the snapshot and the PR URL. If `precommit` fails on markdownlint, run `npx markdownlint-cli2 --fix` on the files this branch added, re-verify with `npm run sync:check`, commit, and push.

---

## Self-review notes

Spec coverage checked against `docs/superpowers/specs/2026-08-19-installable-e2e-and-docs-design.md`:

- 1.1 layout → Task 1
- 1.2 manifest path strings → Task 2; field removal table → Task 3
- 1.3 hooks + dead `.sh` registrations → Task 4
- 1.4 consumers: sync-manifest/lib → Tasks 2 and 3; `bin/cli.js` and `package.json` → Task 5; tests → Tasks 2, 3, 5. `.mcp.json` needs no change (its two `.claude/` references are `_documentation` strings pointing at `.claude/profiles/` and `.claude/docs/`, both of which stay put) — verified while writing this plan, so no task is required.
- 1.5 verification → Task 6 (plus per-task checks)
- 1.6 `git mv` for history → Task 1 Step 2

Phase 2 (documentation) is deliberately out of this plan and gets its own.
