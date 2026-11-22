# Skills plugin

A Claude Code plugin (`@gr8monk3ys/claude-code-plugin`) that ships slash commands, subagents, skills and hooks for Next.js + React + Supabase work, installed through npm or the plugin marketplace.

## Language

**Primitive**:
One of the four plugin building blocks that live at the repo root: `commands`, `agents`, `skills`, `hooks` (`ROOT_PRIMITIVES` in `scripts/lib/manifest.js`).
_Avoid_: Component, module

**Command**:
A flat `commands/<name>.md` file with frontmatter, invoked as `/<name>`.
_Avoid_: Slash script

**Agent**:
A flat `agents/<name>.md` subagent persona.
_Avoid_: Bot, persona file

**Skill**:
A `skills/<bucket>/<name>/SKILL.md` directory that Claude loads by its description.
_Avoid_: Prompt, recipe

**Hook**:
A `hooks/*.js` lifecycle script wired up in `hooks/hooks.json`.
_Avoid_: Trigger, listener

**Monitor**:
A background watcher declared in `.claude/monitors/monitors.json`; counted by the sync but not a root primitive.
_Avoid_: Watcher, daemon

**Bucket**:
A directory under `skills/` that groups skills; `engineering` and `productivity` ship, `misc`, `in-progress` and `deprecated` do not.
_Avoid_: Category, folder

**Promoted bucket**:
A bucket in `PROMOTED_BUCKETS`; only these appear in `plugin.json`, the README tables and `lcc install`.
_Avoid_: Shipped folder

**Manifest**:
The generated `.claude-plugin/plugin.json` and `marketplace.json`, owned by `scripts/sync-manifest.js` and never hand-edited.
_Avoid_: Config, plugin file

**AUTOGEN block**:
An `<!-- AUTOGEN:name -->` region in `README.md` and `CLAUDE.md` that `npm run sync` rewrites from disk.
_Avoid_: Generated section

**Sync**:
Regenerating the manifest and AUTOGEN blocks from the primitives on disk; `sync:check` fails on drift.
_Avoid_: Build, regen

**Router**:
The `ask-lorenzo` skill, a map of every user-reachable command and promoted skill.
_Avoid_: Index, menu

**Docs page**:
The `docs/<bucket>/<skill>.md` page every promoted skill must have, written for the human choosing it.
_Avoid_: Skill readme

**Skill rule**:
An entry in `hooks/skill-rules.json` that `skill-activator.js` evaluates to suggest a skill for a prompt.
_Avoid_: Trigger rule

**lcc**:
The `lorenzo-claude` CLI (`bin/cli.js`, alias `lcc`) that installs and diagnoses the plugin (`install`, `doctor`).
_Avoid_: Installer script
