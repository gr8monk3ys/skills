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
