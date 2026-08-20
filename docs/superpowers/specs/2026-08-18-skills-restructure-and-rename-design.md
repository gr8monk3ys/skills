# Skills restructure + repo rename to `skills`

**Date:** 2026-08-18
**Status:** Approved
**Inspiration:** [mattpocock/skills](https://github.com/mattpocock/skills) (MIT), locally at `~/code/mattpocock-skills` after the rename below.

## Goal

Adopt the structural conventions from mattpocock/skills that make a skill collection navigable and self-enforcing, port 14 of his skills (adapted), add a CONTEXT.md domain language, and rename the repo `claude-code-config` → `skills` on GitHub and locally.

## Part 1: Rename (infrastructure, done directly — not via PR)

Ordered steps:

1. `mv ~/code/skills ~/code/mattpocock-skills` — his clone moves aside; the name frees up locally.
2. GitHub rename `gr8monk3ys/claude-code-config` → `gr8monk3ys/skills` via `gh api -X PATCH repos/gr8monk3ys/claude-code-config -f name=skills`. (PATCH is redirect-safe per fleet notes; this is an intentional rename, not a redirected write.)
3. `mv ~/code/lorenzos-claude-code ~/code/skills` and `git remote set-url origin https://github.com/gr8monk3ys/skills.git`.
4. Ripple updates:
   - `orchestrator/repos.yml`: key `claude-code-config` → `skills`; run `scripts/audit_repos_yml.py` to confirm no drift.
   - `~/code/CLAUDE.md` known-renames list: add `claude-code-config` → `skills` (chain from `lorenzos-claude-code`).
   - In-repo URLs still naming `lorenzos-claude-code` or `claude-code-config`: `package.json` (repository field), `.claude-plugin/plugin.json` (repository, homepage), `README.md` install block.

**Explicit non-goals:** the plugin name (`lorenzos-claude-code`) and npm package (`@gr8monk3ys/claude-code-plugin`) do NOT change — renaming plugin identity orphans existing installs. Separate decision if ever wanted.

## Part 2: Bucket layout (content, via PR)

`.claude/skills/` gains bucket folders modeled on Matt's:

```
.claude/skills/
  engineering/        # promoted — daily code work
  productivity/       # promoted — non-code workflow
  misc/               # NOT promoted — kept, not shipped
  in-progress/        # NOT promoted — beta
  deprecated/         # NOT promoted
```

- Each skill becomes `<bucket>/<name>/SKILL.md` (directory form), replacing flat `.md` files.
- The 4 existing skills (`api-development`, `background-automation`, `database-operations`, `frontend-development`) move to `engineering/`.
- The stale root-level `skills/` directory (duplicate of the old flat files) is deleted.
- **The sync script enforces the convention:** `scripts/sync-manifest.js` + `scripts/lib/manifest.js` learn to (a) recurse buckets, (b) accept `<name>/SKILL.md` form, (c) include only promoted buckets in `plugin.json` and README/CLAUDE.md AUTOGEN tables. `tests/manifest-sync.test.js` covers the new scanning + the promoted/non-promoted rule.
- Each promoted bucket gets a `README.md` listing its skills with one-line descriptions and links (Matt's convention).

## Part 3: Ported skills

All ported skills are adapted, not pasted: Matt's repo-specific plumbing (`setup-matt-pocock-skills` config, his tracker/label conventions, aihero.dev links) is replaced with this repo's equivalents. Attribution: a `LICENSES/mattpocock-skills-MIT.txt` file with his MIT notice, plus a `source:` link in each ported SKILL.md's frontmatter comment.

| Skill | Bucket | Notes |
|---|---|---|
| handoff | productivity/ | compact session → handoff doc |
| wizard | engineering/ | interactive bash walkthroughs for human-only steps |
| resolving-merge-conflicts | engineering/ | hunk-by-hunk, by intent, never `--abort` |
| prototype | engineering/ | throwaway HTML to answer design questions |
| writing-for-agents | productivity/ | how to write docs agents actually follow |
| domain-modeling | engineering/ | maintains CONTEXT.md (Part 5) |
| research | engineering/ | cited background investigation |
| wait-what | productivity/ | re-explain a confusing message |
| to-questionnaire | productivity/ | blocked decision → async questionnaire |
| grilling | misc/ | overlaps superpowers:brainstorming |
| tdd | misc/ | overlaps superpowers:test-driven-development |
| diagnosing-bugs | misc/ | overlaps superpowers:systematic-debugging |
| to-spec | misc/ | overlaps superpowers:writing-plans |
| code-review | misc/ | overlaps superpowers review skills + existing /review |
| implement | misc/ | overlaps superpowers:executing-plans |

The `misc/` six exist in the repo (hand-promotable later) but do not ship in the plugin, preserving the "superpowers handles process" contract and keeping skill-activator routing unambiguous.

## Part 4: Router skill — `ask-lorenzo`

Promoted (`engineering/`). Maps every user-reachable command and skill in this plugin to the situation it fits, mirroring `ask-matt`. Repo CLAUDE.md gains the maintenance rule: any add/rename/remove/behaviour change to a user-reachable skill requires re-syncing `ask-lorenzo`.

## Part 5: CONTEXT.md

New root `CONTEXT.md` establishing the repo's shared language: *promoted bucket*, *AUTOGEN block*, *manifest sync*, *skill-activator*, *monitor*, the command/agent/skill/hook taxonomy, and the superpowers-composition contract. `domain-modeling` maintains it going forward. Repo CLAUDE.md points to it.

## Explicitly not copied (YAGNI)

- Per-skill `docs/` tree (feeds his aihero.dev publishing; no equivalent here)
- `agents/openai.yaml` / multi-harness invocation plumbing (`disable-model-invocation` handled instead by description conventions, matching the existing "WHEN to auto-invoke" style)
- Newsletter / marketplace / skills.sh scaffolding

## Error handling & risks

- **GitHub rename:** old URLs redirect; open PRs and Actions are unaffected. `repos.yml` must be updated same-session or the fleet loops no-op against a 404 key (this exact failure already happened once with this repo).
- **Manifest drift:** `npm run sync:check` is in pre-commit and CI; the restructure must land with sync green in the same commit.
- **Skill-activator `skill-rules.json`:** references to the old flat skill paths must be updated with the moves.

## Testing / verification

1. `npm run sync` then `npm run sync:check` — no drift.
2. `node --test tests/` — manifest tests incl. new bucket rules.
3. `claude plugin validate . --strict` — manifest valid.
4. Spot-check: `plugin.json` skills array contains exactly the promoted set (14 promoted skills: 4 existing + 9 promoted ports + ask-lorenzo), none from `misc/`.
5. `scripts/audit_repos_yml.py` passes after the repos.yml rename.

## Delivery

- Part 1 (rename) executes directly.
- Parts 2–5 land as one branch + PR on the renamed repo, verified per above before the PR opens.
