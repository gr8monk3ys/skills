# codify

## What it does

`codify` turns a correction you give the agent into a deterministic check in
the repo — a lint rule, a type constraint, a test, a dependency boundary, or a
CI validator — so the same mistake fails the build the next time instead of
relying on someone to remember it.

It writes prose to `CLAUDE.md` or `AGENTS.md` only as a last resort, and when it
does, it says why no check could express the rule. Every other correction ends
as code that goes red on the old mistake, with an error message that tells the
next agent how to fix it.

## When to reach for it

Type `/codify <the correction>`, or the agent reaches for it automatically when
you correct how it did something in a way that could happen again — "don't use
X here", "always go through Y", "we never do Z".

Reach for it when you catch yourself correcting the same thing twice, or when a
correction is about the codebase rather than this one task. For a one-off
preference ("rename this variable") there is nothing to recur, and the skill
just applies it. For writing or pruning the prose files themselves, use
[writing-for-agents](../productivity/writing-for-agents.md).

## The ladder

The agent takes the first mechanism that can express the rule, strongest first:

1. **Make it impossible** — change the API, unexport the internal, move the raw
   client behind the one module allowed to import it.
2. **Linter rule** — the linter the repo already runs (ruff, eslint, biome,
   oxlint, shellcheck, clippy), built-in rules before custom ones.
3. **Type constraint** — reject the wrong input at compile time.
4. **Test** — property-based when the rule is general.
5. **CI validator** — a script for rules about the repo itself.

Whatever it picks, it adds a failing example first and shows it going red, then
runs the repo's full verify command green.

## Existing violations

A new rule usually finds old code that breaks it. Small counts get fixed in the
same commit. Large ones get a **ratchet**: a tracked allowlist of today's
violations plus a test that fails if the list grows or keeps an entry that no
longer violates. The list can only shrink.

## Common questions

**Why not just add the rule to CLAUDE.md?**

Prose is a request the next agent may skip, misread, or lose to a long context.
A failing check is not optional, and its message carries the fix to exactly the
place the mistake was made.

**What if my repo has no linter for this?**

The ladder ends in a small validator script plus a test, which any repo can run.
If even that cannot see the rule — it depends on intent or taste — you get one
line of prose and a note on what would make it codifiable later.

**Will it mix this into my feature branch's commits?**

It commits the check, its proof, and the sweep as their own conventional commit,
staging only those files.

**What does the report look like?**

Rule, mechanism (and why stronger rungs did not fit), files, the red-then-green
proof output, and what the sweep fixed or baselined.

## It's working if

- You stop giving the same correction twice.
- The report shows the new check failing on a fixture before it shows the suite
  passing.
- Error messages from the check tell you what to do, not just what is banned.
- `CLAUDE.md` grows rarely, and every line it gains says why it could not be a
  check.
- Allowlists in the repo only ever get shorter.
