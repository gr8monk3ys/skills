# The manifest is generated from disk

`.claude-plugin/plugin.json`, `marketplace.json` and the AUTOGEN tables in `README.md` and `CLAUDE.md` are written by `scripts/sync-manifest.js` from the primitives on disk, and `sync:check` fails pre-commit and CI on drift. We chose this over hand-maintained lists because counts and tables silently went stale, and a stale list that ships is worse than none.
