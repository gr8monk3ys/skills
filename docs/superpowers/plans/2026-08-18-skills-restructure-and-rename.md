# Skills Restructure + Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the repo to `gr8monk3ys/skills`, restructure `.claude/skills/` into promoted/non-promoted buckets enforced by the manifest sync, and port 14 skills from mattpocock/skills (9 promoted, 6 in `misc/`) plus an `ask-lorenzo` router and a root `CONTEXT.md`.

**Architecture:** Rename executes directly (Tasks 1–2). Everything else lands on branch `feat/skills-structure` as one PR (Tasks 3–14). The promoted/non-promoted rule is enforced in code: `scripts/lib/manifest.js` gains `scanSkills(dir, buckets)` that reads only `<bucket>/<name>/SKILL.md`, and `sync-manifest.js` passes only the promoted buckets, so `misc/` skills physically cannot enter `plugin.json`.

**Tech Stack:** Node 18+ (`node:test`, no deps), bash, `gh` CLI, Claude Code plugin manifest.

**Spec:** `docs/superpowers/specs/2026-08-18-skills-restructure-and-rename-design.md`

## Global Constraints

- Promoted buckets are exactly `engineering` and `productivity`; `misc`, `in-progress`, `deprecated` never appear in `plugin.json`, README/CLAUDE.md AUTOGEN tables, or CLI installs.
- The plugin name `lorenzos-claude-code` and npm package `@gr8monk3ys/claude-code-plugin` DO NOT change anywhere (settings keys, plugin dirs, marketplace name). Only repository/homepage **URLs** change.
- Ported files keep MIT attribution: `LICENSES/mattpocock-skills-MIT.txt` + an HTML comment under each ported SKILL.md's frontmatter.
- Port source is `~/code/mattpocock-skills` (after Task 1 moves it). Never copy a skill's `agents/` subdirectory (openai.yaml plumbing we don't use).
- JS style: match the file you're editing — `scripts/` and `tests/` use single quotes/no semicolons; `bin/cli.js` uses double quotes/semicolons.
- Commits are conventional (`feat:`, `chore:`, `test:`), each ending with the line `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- The final PR must NOT be a draft (fleet rule).
- In shell commands, quote any argument starting with `=` (zsh equals-expansion breaks `echo ===`).

---

### Task 1: The rename (direct — no branch, no PR)

**Files:** none in-repo; filesystem + GitHub only.

**Interfaces:**

- Produces: repo lives at `~/code/skills`, GitHub name `gr8monk3ys/skills`, origin URL updated. Matt's clone at `~/code/mattpocock-skills`. All later tasks run in `~/code/skills`.

- [ ] **Step 1: Preflight — confirm both working trees are safe to move**

Run: `cd /Users/natalyscaturchio/code/skills && git status --porcelain | head; cd /Users/natalyscaturchio/code/lorenzos-claude-code && git status --porcelain | head`
Expected: mattpocock clone clean; lorenzos-claude-code shows at most the untracked/committed plan+spec docs. Anything else: stop and report.

- [ ] **Step 2: Move Matt's clone aside**

```bash
mv /Users/natalyscaturchio/code/skills /Users/natalyscaturchio/code/mattpocock-skills
```

- [ ] **Step 3: Rename on GitHub**

```bash
gh api -X PATCH repos/gr8monk3ys/claude-code-config -f name=skills --jq .full_name
```

Expected output: `gr8monk3ys/skills`

- [ ] **Step 4: Move local folder and fix remote**

```bash
mv /Users/natalyscaturchio/code/lorenzos-claude-code /Users/natalyscaturchio/code/skills
cd /Users/natalyscaturchio/code/skills
git remote set-url origin https://github.com/gr8monk3ys/skills.git
git fetch origin --prune && git remote show origin | head -4
```

Expected: fetch succeeds; remote URL shows `gr8monk3ys/skills.git`.

- [ ] **Step 5: Verify no redirect dependence**

Run: `gh repo view gr8monk3ys/skills --json name,nameWithOwner`
Expected: `{"name":"skills","nameWithOwner":"gr8monk3ys/skills"}`

### Task 2: Fleet plumbing for the rename

**Files:**

- Modify: `/Users/natalyscaturchio/code/orchestrator/repos.yml` (line ~96, key `claude-code-config`)
- Modify: `/Users/natalyscaturchio/code/CLAUDE.md` (known-renames bullet in "gh traps")

**Interfaces:**

- Consumes: Task 1 complete (GitHub name is `skills`).
- Produces: fleet config that resolves the new name; loops keep producing output.

- [ ] **Step 1: Update repos.yml key**

In `/Users/natalyscaturchio/code/orchestrator/repos.yml`, change:

```yaml
  claude-code-config:   { track: X, status: automate, pm: bun, loops: [dep_hygiene, ci_repair] }   # your CC plugin; renamed from lorenzos-claude-code — the old key 404'd, so both loops had been no-ops
```

to:

```yaml
  skills:               { track: X, status: automate, pm: bun, loops: [dep_hygiene, ci_repair] }   # your CC plugin; renamed lorenzos-claude-code → claude-code-config → skills (2026-08-18)
```

- [ ] **Step 2: Run the drift audit**

Run: `cd /Users/natalyscaturchio/code/orchestrator && python3 scripts/audit_repos_yml.py`
Expected: exit 0, no complaint about `skills`. If it flags `base_branch` mismatch, read the repo's default branch with `gh repo view gr8monk3ys/skills --json defaultBranchRef` and fix repos.yml to match.

- [ ] **Step 3: Commit and push orchestrator (documented direct route)**

```bash
cd /Users/natalyscaturchio/code/orchestrator
git add repos.yml
git commit -m "chore: rename claude-code-config -> skills in repos.yml

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push origin master:main
```

- [ ] **Step 4: Update fleet CLAUDE.md known-renames**

In `/Users/natalyscaturchio/code/CLAUDE.md`, in the renames bullet, change `` `lorenzos-claude-code`→`claude-code-config` `` to `` `lorenzos-claude-code`→`claude-code-config`→`skills` ``. Also update the line "Two exceptions: `vivance/` … " region if it names the moved clone — and add `mattpocock-skills` is a reference clone (one sentence max, only if a natural spot exists; do not restructure the doc).

### Task 3: Feature branch + in-repo URL updates

**Files:**

- Modify: `/Users/natalyscaturchio/code/skills/package.json` (repository/homepage/bugs URLs if present)
- Modify: `.claude-plugin/plugin.json` (`repository`, `homepage` base fields)
- Modify: `README.md` (marketplace add URL, badge/links)

**Interfaces:**

- Produces: branch `feat/skills-structure`; all GitHub URLs point at `gr8monk3ys/skills`. Later tasks commit onto this branch.

- [ ] **Step 1: Branch**

```bash
cd /Users/natalyscaturchio/code/skills && git checkout -b feat/skills-structure
```

- [ ] **Step 2: Find every stale URL**

Run: `grep -rn "github.com/gr8monk3ys/lorenzos-claude-code\|github.com/gr8monk3ys/claude-code-config" --include="*.json" --include="*.md" --include="*.js" . | grep -v node_modules | grep -v docs/superpowers`
Update every hit to `https://github.com/gr8monk3ys/skills` (keep any `#readme` suffix). Do NOT touch bare `lorenzos-claude-code` strings that are plugin identity (plugin.json `name`, cli.js settings keys/plugin dir, marketplace name) — only URLs.

- [ ] **Step 3: Sync + verify + commit**

```bash
npm run sync && npm run sync:check && node --test tests/
git add -A && git commit -m "chore: point repository URLs at gr8monk3ys/skills

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

Expected: sync clean, tests pass (plugin.json regenerates `repository` from its base fields).

### Task 4: `scanSkills` — bucket-aware scanner (TDD)

**Files:**

- Create: `tests/fixtures/manifest/skills/engineering/alpha/SKILL.md`, `tests/fixtures/manifest/skills/engineering/alpha/notes.md`, `tests/fixtures/manifest/skills/engineering/README.md`, `tests/fixtures/manifest/skills/productivity/beta/SKILL.md`, `tests/fixtures/manifest/skills/misc/old-skill/SKILL.md`
- Modify: `scripts/lib/manifest.js`, `scripts/sync-manifest.js`
- Test: `tests/manifest-sync.test.js`

**Interfaces:**

- Produces: `scanSkills(dir, buckets)` → `[{ name, description, path, bucket }]`, exported from `scripts/lib/manifest.js`; `sync-manifest.js` uses `m.scanSkills(path.join(REPO_ROOT, '.claude/skills'), PROMOTED)` with `const PROMOTED = ['engineering', 'productivity']`.

- [ ] **Step 1: Create fixtures**

`tests/fixtures/manifest/skills/engineering/alpha/SKILL.md`:

```markdown
---
name: alpha
description: Alpha engineering skill
---
Body.
```

`tests/fixtures/manifest/skills/engineering/alpha/notes.md` (no frontmatter — must be ignored, would throw in scanCategory):

```markdown
Support file without frontmatter.
```

`tests/fixtures/manifest/skills/engineering/README.md`:

```markdown
Bucket readme — must be ignored.
```

`tests/fixtures/manifest/skills/productivity/beta/SKILL.md`:

```markdown
---
name: beta
description: Beta productivity skill
---
Body.
```

`tests/fixtures/manifest/skills/misc/old-skill/SKILL.md`:

```markdown
---
name: old-skill
description: Not promoted — must be excluded
---
Body.
```

- [ ] **Step 2: Write failing tests** (append to `tests/manifest-sync.test.js`)

```js
test('scanSkills returns only promoted-bucket skills, reading SKILL.md only', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'productivity'])
  assert.deepEqual(entries.map(e => e.name), ['alpha', 'beta'])
  const alpha = entries.find(e => e.name === 'alpha')
  assert.equal(alpha.bucket, 'engineering')
  assert.equal(alpha.description, 'Alpha engineering skill')
  assert.match(alpha.path.replace(/\\/g, '/'), /skills\/engineering\/alpha\/SKILL\.md$/)
})

test('scanSkills ignores bucket READMEs, support files, and non-promoted buckets', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'productivity'])
  assert.ok(!entries.some(e => e.name === 'old-skill'))
  assert.ok(!entries.some(e => e.name === 'notes'))
  assert.ok(!entries.some(e => e.name === 'README'))
})

test('scanSkills tolerates a missing bucket directory', () => {
  const fixtures = path.join(__dirname, 'fixtures/manifest/skills')
  const entries = manifest.scanSkills(fixtures, ['engineering', 'does-not-exist'])
  assert.deepEqual(entries.map(e => e.name), ['alpha'])
})
```

- [ ] **Step 3: Run to verify failure**

Run: `node --test tests/manifest-sync.test.js`
Expected: FAIL — `manifest.scanSkills is not a function`

- [ ] **Step 4: Implement** (in `scripts/lib/manifest.js`, after `scanCategory`; add `scanSkills` to `module.exports`)

```js
function scanSkills(dir, buckets) {
  const out = []
  for (const bucket of buckets) {
    const bucketDir = path.join(dir, bucket)
    if (!fs.existsSync(bucketDir)) continue
    for (const entry of fs.readdirSync(bucketDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      const skillFile = path.join(bucketDir, entry.name, 'SKILL.md')
      if (!fs.existsSync(skillFile)) continue
      const fm = parseFrontmatter(fs.readFileSync(skillFile, 'utf8'))
      out.push({
        name: fm.name || entry.name,
        description: fm.description || '',
        path: skillFile,
        bucket,
      })
    }
  }
  out.sort((a, b) => a.name.localeCompare(b.name))
  return out
}
```

- [ ] **Step 5: Wire into sync-manifest.js**

In `scripts/sync-manifest.js`, below the constants add `const PROMOTED = ['engineering', 'productivity']`, and change:

```js
  const skills = m.scanCategory(path.join(REPO_ROOT, '.claude/skills'))
```

to:

```js
  const skills = m.scanSkills(path.join(REPO_ROOT, '.claude/skills'), PROMOTED)
```

- [ ] **Step 6: Tests pass, sync still green on old layout?**

Run: `node --test tests/manifest-sync.test.js`
Expected: PASS. Note: `npm run sync:check` now reports drift (0 skills found — flat files aren't migrated yet). That is expected mid-branch; Task 5 restores it. Do NOT run sync here.

- [ ] **Step 7: Commit**

```bash
git add scripts/lib/manifest.js scripts/sync-manifest.js tests/
git commit -m "feat: bucket-aware scanSkills with promoted-bucket enforcement

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 5: Migrate the 4 existing skills; delete stale root `skills/`

**Files:**

- Move: `.claude/skills/<name>.md` → `.claude/skills/engineering/<name>/SKILL.md` (×4)
- Delete: root `skills/` (verified exact duplicate of old `.claude/skills/`)
- Regenerated: `.claude-plugin/plugin.json`, `README.md`, `CLAUDE.md` AUTOGEN blocks

**Interfaces:**

- Consumes: `scanSkills` from Task 4.
- Produces: bucket layout live; plugin.json paths like `.claude/skills/engineering/api-development/SKILL.md`.

- [ ] **Step 1: Move**

```bash
cd /Users/natalyscaturchio/code/skills
for s in api-development background-automation database-operations frontend-development; do
  mkdir -p .claude/skills/engineering/$s
  git mv .claude/skills/$s.md .claude/skills/engineering/$s/SKILL.md
done
```

- [ ] **Step 2: Delete root duplicate after confirming nothing references it**

Run: `grep -rn '"skills/\|\bskills/api-development\|\bskills/frontend' --include="*.js" --include="*.json" bin scripts .claude-plugin package.json | grep -v node_modules`
Expected: no hits (plugin.json references `.claude/skills/...`). Then: `git rm -r skills/`

- [ ] **Step 3: Sync + verify counts unchanged**

Run: `npm run sync && npm run sync:check && node --test tests/`
Expected: pass; README counts line still says **4 skills**; `python3 -c "import json; d=json.load(open('.claude-plugin/plugin.json')); print(len(d['skills']), d['skills'][0]['path'])"` → `4 .claude/skills/engineering/api-development/SKILL.md`

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor: move skills to promoted bucket layout, drop stale root skills/

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 6: Attribution file + port the 5 engineering promoted skills

**Files:**

- Create: `LICENSES/mattpocock-skills-MIT.txt`
- Create: `.claude/skills/engineering/{wizard,resolving-merge-conflicts,prototype,research,domain-modeling}/` from `~/code/mattpocock-skills/skills/engineering/<name>/`

**Interfaces:**

- Consumes: bucket layout from Task 5.
- Produces: 9 promoted engineering skills after this task.

- [ ] **Step 1: Attribution file**

```bash
mkdir -p LICENSES
{ echo "The skills adapted from https://github.com/mattpocock/skills are"
  echo "Copyright (c) 2026 Matt Pocock, MIT License, reproduced below."
  echo
  cat /Users/natalyscaturchio/code/mattpocock-skills/LICENSE
} > LICENSES/mattpocock-skills-MIT.txt
```

- [ ] **Step 2: Copy skills, dropping `agents/`**

```bash
SRC=/Users/natalyscaturchio/code/mattpocock-skills/skills/engineering
for s in wizard resolving-merge-conflicts prototype research domain-modeling; do
  cp -R "$SRC/$s" .claude/skills/engineering/$s
  rm -rf .claude/skills/engineering/$s/agents
done
```

This carries support files: `wizard/template.sh`, `prototype/{LOGIC.md,UI.md}`, `domain-modeling/{ADR-FORMAT.md,CONTEXT-FORMAT.md}`.

- [ ] **Step 3: Add attribution comment to each ported SKILL.md**

Directly after the closing `---` of the frontmatter in each of the 5 `SKILL.md`s, insert:

```markdown
<!-- Adapted from mattpocock/skills (MIT © Matt Pocock): https://github.com/mattpocock/skills — see LICENSES/mattpocock-skills-MIT.txt -->
```

- [ ] **Step 4: Adaptation check**

Run: `grep -rniE "matt|aihero|setup-matt" .claude/skills/engineering/{wizard,resolving-merge-conflicts,prototype,research,domain-modeling}`
Expected: only the attribution comments you just added (these 5 have no repo-specific plumbing; "matters"/"Status" false positives are fine). Fix anything real.

- [ ] **Step 5: Sync, verify 9 skills, commit**

Run: `npm run sync && node --test tests/ && python3 -c "import json; print(len(json.load(open('.claude-plugin/plugin.json'))['skills']))"`
Expected: `9`

```bash
git add -A && git commit -m "feat: port wizard, resolving-merge-conflicts, prototype, research, domain-modeling (MIT, mattpocock/skills)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 7: Port the 4 productivity promoted skills

**Files:**

- Create: `.claude/skills/productivity/{handoff,writing-for-agents,wait-what,to-questionnaire}/` from `~/code/mattpocock-skills/skills/productivity/<name>/`

**Interfaces:**

- Produces: 13 promoted skills after this task. `handoff`, `wait-what`, `to-questionnaire` keep `disable-model-invocation: true` frontmatter (user-invoked); `writing-for-agents` stays model-invoked.

- [ ] **Step 1: Copy, dropping `agents/`**

```bash
SRC=/Users/natalyscaturchio/code/mattpocock-skills/skills/productivity
mkdir -p .claude/skills/productivity
for s in handoff writing-for-agents wait-what to-questionnaire; do
  cp -R "$SRC/$s" .claude/skills/productivity/$s
  rm -rf .claude/skills/productivity/$s/agents
done
```

Carries `writing-for-agents/SKILL-MECHANICS.md`.

- [ ] **Step 2: Attribution comment** — same line as Task 6 Step 3, in each of the 4 SKILL.md files.

- [ ] **Step 3: Sync, verify 13, commit**

Run: `npm run sync && node --test tests/ && python3 -c "import json; print(len(json.load(open('.claude-plugin/plugin.json'))['skills']))"`
Expected: `13`

```bash
git add -A && git commit -m "feat: port handoff, writing-for-agents, wait-what, to-questionnaire (MIT, mattpocock/skills)

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 8: Port the 6 overlap skills into `misc/` (not shipped)

**Files:**

- Create: `.claude/skills/misc/{grilling,tdd,diagnosing-bugs,to-spec,code-review,implement}/`

**Interfaces:**

- Produces: skills present on disk, absent from plugin.json (count stays 13).

- [ ] **Step 1: Copy, dropping `agents/`**

```bash
mkdir -p .claude/skills/misc
for s in tdd diagnosing-bugs to-spec code-review implement; do
  cp -R /Users/natalyscaturchio/code/mattpocock-skills/skills/engineering/$s .claude/skills/misc/$s
  rm -rf .claude/skills/misc/$s/agents
done
cp -R /Users/natalyscaturchio/code/mattpocock-skills/skills/productivity/grilling .claude/skills/misc/grilling
rm -rf .claude/skills/misc/grilling/agents
```

Carries `tdd/{mocking.md,tests.md}` and `diagnosing-bugs/scripts/`.

- [ ] **Step 2: Attribution + not-shipped note**

In each of the 6 SKILL.md files, directly after the frontmatter insert the attribution comment (Task 6 Step 3) plus this line:

```markdown
> **Not shipped in the plugin.** Overlaps a superpowers skill (see table in `.claude/skills/misc/README.md`). To ship it, move it to a promoted bucket and run `npm run sync`.
```

- [ ] **Step 3: Replace Matt's setup references (the only two real adaptations)**

In `.claude/skills/misc/to-spec/SKILL.md` replace:
`The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run` `` `/setup-matt-pocock-skills` `` `.`
with:
`The issue tracker and triage label vocabulary should have been provided to you. If not, ask the user whether to use GitHub Issues (via` `` `gh` `` `) or a local` `` `docs/issues/` `` `folder, and which labels they triage with.`

In `.claude/skills/misc/code-review/SKILL.md` replace:
`The issue tracker should have been provided to you. If` `` `docs/agents/issue-tracker.md` `` ` is missing, tell the user to run ` `` `/setup-matt-pocock-skills` `` `.`
with:
`The issue tracker should have been provided to you. If` `` `docs/agents/issue-tracker.md` `` ` is missing, ask the user whether to use GitHub Issues (via ` `` `gh` `` `) or a local` `` `docs/issues/` `` `folder.`

- [ ] **Step 4: Verify misc is invisible to the manifest**

Run: `npm run sync && npm run sync:check && python3 -c "import json; d=json.load(open('.claude-plugin/plugin.json')); assert len(d['skills'])==13 and not any('/misc/' in s['path'] for s in d['skills']); print('misc excluded, 13 promoted')"`
Expected: `misc excluded, 13 promoted`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: port superpowers-overlap set (grilling, tdd, diagnosing-bugs, to-spec, code-review, implement) into misc/

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 9: `ask-lorenzo` router skill

**Files:**

- Create: `.claude/skills/engineering/ask-lorenzo/SKILL.md`

**Interfaces:**

- Produces: 14th promoted skill; the routing map later tasks (CLAUDE.md rule) reference by name.

- [ ] **Step 1: Write the skill** (full content)

```markdown
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
```

- [ ] **Step 2: Sync, verify 14, commit**

Run: `npm run sync && node --test tests/ && python3 -c "import json; print(len(json.load(open('.claude-plugin/plugin.json'))['skills']))"`
Expected: `14`

```bash
git add -A && git commit -m "feat: add ask-lorenzo router skill

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 10: `CONTEXT.md` + repo `CLAUDE.md` conventions

**Files:**

- Create: `CONTEXT.md`
- Modify: `CLAUDE.md` (directory map + new conventions; hand-edits stay OUTSIDE the AUTOGEN markers)

**Interfaces:**

- Produces: the vocabulary `domain-modeling` maintains; the CLAUDE.md rules future sessions follow.

- [ ] **Step 1: Write `CONTEXT.md`** (full content)

```markdown
# CONTEXT.md — shared language for this repo

The vocabulary used in code, commits, and conversation here. Maintained by the `domain-modeling` skill. If a term drifts from reality, fix this file in the same change.

- **Promoted bucket** — `engineering/` or `productivity/` under `.claude/skills/`. Only promoted skills ship: `sync-manifest.js` scans exactly these buckets into `plugin.json`, the AUTOGEN tables, and the CLI install. `misc/`, `in-progress/`, and `deprecated/` are non-promoted: present in the repo, invisible to the plugin.
- **Manifest sync** — `npm run sync` regenerates `plugin.json` and every AUTOGEN block from the `.md` sources. `npm run sync:check` (pre-commit + CI) fails on drift. The sources are the truth; never hand-edit generated output.
- **AUTOGEN block** — a `<!-- AUTOGEN:name -->…<!-- /AUTOGEN:name -->` region in README.md/CLAUDE.md, rewritten by the sync. Deleting a marker is drift, not cleanup.
- **Skill** — `<bucket>/<name>/SKILL.md` plus optional support files. `disable-model-invocation: true` marks it user-invoked (reachable only by the human); otherwise the model may reach for it.
- **Router** — `ask-lorenzo`, the skill that maps situations to commands/skills. Any change to a user-reachable command or promoted skill must re-sync its map.
- **Skill-activator** — the hook (`.claude/hooks/skill-activator.js` + `skill-rules.json`) that scores prompts by keywords/patterns/directories/intents and routes to a skill here or in superpowers.
- **The superpowers contract** — superpowers owns process (brainstorming, TDD, debugging, plans, review); this plugin owns stack scaffolding. The `misc/` skills that duplicate superpowers stay non-promoted to keep routing unambiguous.
- **Port** — a skill adapted from mattpocock/skills (MIT; see `LICENSES/mattpocock-skills-MIT.txt`). Ports drop his `agents/` openai.yaml plumbing and his repo-specific setup references.
- **Monitor** — a background watcher declared in `.claude/monitors/monitors.json`, counted by the sync but not a skill.
```

- [ ] **Step 2: Update `CLAUDE.md`**

Outside the AUTOGEN blocks:

1. In the directory map, change the `.claude/skills/` line to: `` .claude/skills/<bucket>/<name>/SKILL.md  # engineering|productivity ship; misc|in-progress|deprecated don't ``
2. Add after the directory map:

```markdown
## Skill buckets

`engineering/` and `productivity/` are the promoted buckets — exactly these ship in `plugin.json`, the README tables, and `lcc install` (enforced by `scanSkills` in `scripts/lib/manifest.js`, not by convention). `misc/` holds skills that overlap superpowers, kept unshipped on purpose. Promote by moving the folder and running `npm run sync`.

`ask-lorenzo` is the router. When you add, rename, remove, or change the behaviour of a user-reachable command or promoted skill, re-read its SKILL.md and update the map — a router that lies is worse than none.

`CONTEXT.md` holds this repo's shared vocabulary; use its terms and keep it current (the `domain-modeling` skill maintains it).
```

- [ ] **Step 3: Sync (CLAUDE.md AUTOGEN untouched but check), test, commit**

```bash
npm run sync:check && node --test tests/
git add CONTEXT.md CLAUDE.md && git commit -m "docs: add CONTEXT.md shared language and bucket conventions

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 11: Bucket READMEs

**Files:**

- Create: `.claude/skills/engineering/README.md`, `.claude/skills/productivity/README.md`, `.claude/skills/misc/README.md`

**Interfaces:**

- Consumes: all skills placed (Tasks 5–9). Names/descriptions must match the SKILL.md frontmatter exactly.

- [ ] **Step 1: Write the three READMEs**

Each promoted README: an intro line, then **User-invoked** and **Model-invoked** sections listing `- **[name](./name/SKILL.md)** — <description from its frontmatter, first sentence>`. Engineering lists: ask-lorenzo (user-invoked); api-development, background-automation, database-operations, frontend-development, wizard, resolving-merge-conflicts, prototype, research, domain-modeling (model-invoked). Productivity lists: handoff, wait-what, to-questionnaire (user-invoked); writing-for-agents (model-invoked).

`misc/README.md` is a flat table with the overlap mapping:

```markdown
# misc/ — kept, not shipped

Ports from mattpocock/skills that duplicate superpowers. They stay out of the plugin so skill-activator routing stays unambiguous. To ship one, move it to a promoted bucket and run `npm run sync`.

| Skill | Overlaps |
| --- | --- |
| [grilling](./grilling/SKILL.md) | superpowers:brainstorming |
| [tdd](./tdd/SKILL.md) | superpowers:test-driven-development |
| [diagnosing-bugs](./diagnosing-bugs/SKILL.md) | superpowers:systematic-debugging |
| [to-spec](./to-spec/SKILL.md) | superpowers:writing-plans |
| [code-review](./code-review/SKILL.md) | superpowers:requesting-code-review + /review |
| [implement](./implement/SKILL.md) | superpowers:executing-plans |
```

- [ ] **Step 2: Verify READMEs don't leak into the manifest**

Run: `npm run sync:check`
Expected: clean (scanSkills ignores bucket README.md — proven by Task 4's test).

- [ ] **Step 3: Commit**

```bash
git add .claude/skills && git commit -m "docs: bucket READMEs with invocation split and overlap map

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 12: skill-activator rules for the model-invoked ports

**Files:**

- Modify: `.claude/hooks/skill-rules.json` (append to the `skills` array)

**Interfaces:**

- Consumes: existing entry shape `{ name, priority, keywords, patterns, directories, intents }` (see the `api-development` entry).

- [ ] **Step 1: Append six entries**

```json
{ "name": "wizard", "priority": 1, "keywords": ["credentials", "secrets", "provision", "dashboard", "onboarding", "setup wizard", "cutover", "migration"], "patterns": ["\\.env\\b", "gh secret", "gh variable"], "directories": [], "intents": ["set.*up.*(secret|credential|env)", "walk.*through.*setup", "provision.*infra"] },
{ "name": "resolving-merge-conflicts", "priority": 1, "keywords": ["merge conflict", "rebase conflict", "conflict markers", "ours", "theirs"], "patterns": ["<<<<<<<", ">>>>>>>", "CONFLICT \\("], "directories": [], "intents": ["resolve.*conflict", "fix.*merge", "finish.*rebase"] },
{ "name": "prototype", "priority": 1, "keywords": ["prototype", "throwaway", "mockup", "spike", "proof of concept", "poc"], "patterns": [], "directories": [], "intents": ["prototype.*", "try.*variations", "compare.*designs", "answer.*design question"] },
{ "name": "research", "priority": 1, "keywords": ["research", "investigate", "primary sources", "cited", "find out whether"], "patterns": [], "directories": [], "intents": ["research.*", "investigate.*question", "compare.*(libraries|approaches|vendors)"] },
{ "name": "domain-modeling", "priority": 1, "keywords": ["context.md", "glossary", "vocabulary", "domain model", "adr", "terminology", "jargon"], "patterns": ["CONTEXT\\.md", "ADR-\\d+"], "directories": [], "intents": ["update.*context", "define.*term", "record.*decision", "write.*adr"] },
{ "name": "writing-for-agents", "priority": 1, "keywords": ["skill.md", "claude.md", "agents.md", "write a skill", "agent docs"], "patterns": ["SKILL\\.md", "CLAUDE\\.md", "AGENTS\\.md"], "directories": [".claude/skills"], "intents": ["write.*skill", "improve.*(claude|agents)\\.md", "document.*for.*agent"] }
```

- [ ] **Step 2: Validate + smoke the activator**

Run: `python3 -m json.tool .claude/hooks/skill-rules.json > /dev/null && echo valid && node -e "require('/Users/natalyscaturchio/code/skills/.claude/hooks/skill-activator.js')" 2>&1 | head -3`
Expected: `valid`; the activator loads without throwing (it may print nothing or usage info — a stack trace referencing skill-rules.json is a failure).

- [ ] **Step 3: Commit**

```bash
git add .claude/hooks/skill-rules.json && git commit -m "feat: skill-activator rules for the six model-invoked ports

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 13: CLI install respects promoted buckets

**Files:**

- Modify: `bin/cli.js` (`componentsToCopy` in `install()`, `components` in `doctor()`)

**Interfaces:**

- Consumes: bucket layout; PROMOTED buckets `engineering`, `productivity`.
- Produces: `lcc install` copies promoted skills flattened to `~/.claude/skills/<name>/`; `misc/` never installs.

- [ ] **Step 1: Replace the skills copy** (cli.js style: double quotes + semicolons)

Remove `{ name: "skills", src: path.join(sourceClaude, "skills") },` from `componentsToCopy` and, after that copy loop, add:

```js
  // Skills ship from promoted buckets only, flattened to ~/.claude/skills/<name>/
  const PROMOTED_BUCKETS = ["engineering", "productivity"];
  for (const bucket of PROMOTED_BUCKETS) {
    const bucketDir = path.join(sourceClaude, "skills", bucket);
    if (!fs.existsSync(bucketDir)) continue;
    for (const entry of fs.readdirSync(bucketDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      copyDirSync(
        path.join(bucketDir, entry.name),
        path.join(CLAUDE_DIR, "skills", entry.name),
      );
    }
    success(`Installed skills (${bucket})`);
  }
```

- [ ] **Step 2: Update doctor count**

Change `{ name: "skills", expected: 3 },` to `{ name: "skills", expected: 14 },` and `{ name: "commands", expected: 14 },` to `{ name: "commands", expected: 17 },` (both were already stale).

- [ ] **Step 3: Smoke-test against a temp HOME**

Run: `TMP=$(mktemp -d) && HOME="$TMP" node bin/cli.js install && ls "$TMP/.claude/skills" && [ ! -d "$TMP/.claude/skills/misc" ] && [ -f "$TMP/.claude/skills/wizard/SKILL.md" ] && echo CLI-OK`
Expected: `CLI-OK`, listing shows 14 flattened skill dirs, no `misc`. (If cli.js resolves `~` some other way, read how `CLAUDE_DIR` is computed at the top of the file and adjust the env var accordingly.)

- [ ] **Step 4: Commit**

```bash
git add bin/cli.js && git commit -m "fix: lcc install copies promoted skill buckets only; doctor counts current

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

### Task 14: Full verification + PR

**Files:** none new.

- [ ] **Step 1: The full gauntlet**

```bash
npm run sync:check
node --test tests/
claude plugin validate . --strict
python3 -c "import json; d=json.load(open('.claude-plugin/plugin.json')); s=[x['path'] for x in d['skills']]; assert len(s)==14, len(s); assert all('/misc/' not in p and '/in-progress/' not in p for p in s); print('plugin.json: 14 promoted, none leaked')"
npm pack --dry-run 2>&1 | grep -c "SKILL.md"
```

Expected: all green; the pack listing includes the SKILL.md files (if 0, add `.claude/skills` to package.json `files` and re-run). If `claude plugin validate` flags the skills array shape, read its message — fix the manifest builder, not the validator.

- [ ] **Step 2: Run integration smoke tests**

Run: `node tests/run-all.js`
Expected: pass. If it asserts old flat skill paths, update its expectations to the bucket layout in the same commit.

- [ ] **Step 3: Push and open the PR (NOT a draft)**

```bash
git push -u origin feat/skills-structure
gh pr create --title "feat: bucket skill layout, 14 ported skills, ask-lorenzo router, CONTEXT.md" --body "$(cat <<'EOF'
Implements docs/superpowers/specs/2026-08-18-skills-restructure-and-rename-design.md:

- `.claude/skills/` restructured into promoted (`engineering/`, `productivity/`) and non-promoted (`misc/`) buckets — enforced by `scanSkills` in the manifest sync, not convention
- 14 skills ported from mattpocock/skills (MIT, attribution in LICENSES/): 9 promoted, 6 superpowers-overlap skills kept unshipped in `misc/`
- `ask-lorenzo` router skill, `CONTEXT.md` shared language, bucket READMEs
- skill-activator rules for the model-invoked ports; `lcc install` copies promoted buckets only
- Repo URLs updated for the `claude-code-config` → `skills` rename (plugin + npm identity unchanged)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Confirm PR checks run**

Run: `gh pr checks --watch` (or report the PR URL and note which required check is pending).
Expected: the repo's required status check fires on the PR. Report the PR URL.
