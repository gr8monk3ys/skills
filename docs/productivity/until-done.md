# until-done

## What it does

`until-done` is "`/loop` don't stop until it's finished and polished" made
checkable. It turns your goal into 5–10 written criteria — works, looks
finished, has depth, not AI slop, ships — then works in a self-paced loop until
every one is met and verified on screen, sending you builds as they become ready.

State lives in a progress file in the project, not in the conversation, so any
firing — or a fresh session — can pick up exactly where the last one stopped.

## When to reach for it

You invoke this by typing `/until-done <goal>` — the agent won't reach for it on
its own. Example: `/until-done the game is beta-ready and could run ads`.

Reach for it for open-ended polish work you would otherwise babysit. For a
fixed list of tasks, [do-it-all](./do-it-all.md) is enough; for watching a PR,
use the [`/babysit`](../../commands/babysit.md) command.

## The finish line

Without written criteria, "polished" means whatever the agent last did. The
criteria make it falsifiable, and every third firing adds a harsh-critic pass
over screenshots, so "looks cheap" becomes a new criterion rather than a
shrug.

## Common questions

**When does it stop?**

When every criterion is met and checked, when only your steps remain, or after
three firings with no progress. It says which.

**Will it fill my context?**

It saves state to the progress file and suggests [pick-up](./pick-up.md) in a
fresh session once the context grows large.

## It's working if

- `.claude/progress/<goal>.md` exists and changes every firing.
- You receive builds, renders or trailers without asking.
- The stop message names which condition ended the loop.
