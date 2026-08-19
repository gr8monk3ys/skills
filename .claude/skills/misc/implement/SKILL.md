---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

<!-- Adapted from mattpocock/skills (MIT © Matt Pocock): https://github.com/mattpocock/skills — see LICENSES/mattpocock-skills-MIT.txt -->

> **Not shipped in the plugin.** Overlaps a superpowers skill (see table in `.claude/skills/misc/README.md`). To ship it, move it to a promoted bucket and run `npm run sync`.

Implement the work described by the user in the spec or tickets.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work to the current branch.
