# Plugin primitives live flat at the repo root

Commands, agents, skills and hooks sit at the repo root, and `commands/` and `agents/` are never nested. Claude Code auto-discovers them from the plugin root without recursing, and only directory-path entries in `plugin.json` are honoured, so a file in a subdirectory is counted and listed but invisible to every installed user. `tests/run-all.js` and CI fail on nested files; the repo's own configuration stays under `.claude/`.
