# full-review

## What it does

`full-review` runs the three reviews you otherwise type one by one — code
review, security review, and Matt Pocock's architecture review — merges their
findings into one deduplicated list, fixes all of them, and opens one PR.

It treats every review question as already answered with "whatever you
recommend": architecture candidates with a clear payoff get built, and the
grilling questions get the recommended answer, recorded in the PR.

## When to reach for it

You invoke this by typing `/full-review` — the agent won't reach for it on its
own. Pass a scope (`src/bot`, `since main`) or nothing for the whole repo.

Reach for it at the end of a feature push or before a release. For a quick
pre-completion gate without the architecture pass, use the
[`/verify`](../../commands/verify.md) command instead.

## Prerequisites

The `mattpocock-skills` plugin, for the architecture review and its setup step.
`code-review` and `security-review` ship with Claude Code. If the repo has no
`docs/agents/` folder, the skill runs the Matt Pocock setup first with its
defaults.

## Common questions

**Why one PR instead of three?**

The reviews overlap. One merged list means one fix per problem and one CI run.

**Will it skip findings?**

Only with a stated reason, and the PR table shows every finding as fixed or
skipped.

## It's working if

- The PR has a table of every finding and its outcome.
- Build, types, lint and tests pass before it reports.
- False positives were dropped after reading the code, not fixed blindly.
