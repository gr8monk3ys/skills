# pick-up

## What it does

`pick-up` resumes work from another or paused session. It finds the session by
topic — through the app's session tools, transcripts, handoff documents,
progress files and git — rebuilds where it really stopped, recaps it in five
lines, and continues.

It checks the earlier session's claims against the real state — branch, PR, CI,
running jobs — before trusting them, and it never re-asks a question you
already answered there.

## When to reach for it

You invoke this by typing `/pick-up <topic>` — the agent won't reach for it on
its own. Examples: `/pick-up hollow crown`, `/pick-up all Monkey SMP sessions`.
Add `recap only` to stop after the recap.

Reach for it at the start of a fresh session that continues older work. It is
the receiving end of [handoff](./handoff.md): handoff writes the document,
pick-up finds and acts on it — or works without one.

## Common questions

**What if several sessions match?**

It takes all of them. Sessions that still exist are resumed in place by
messaging them; otherwise the work continues here.

**Why not just paste the context?**

Because pasted context is a claim. pick-up reads the git and PR state too, so
it starts from what is true now.

## It's working if

- The recap names goal, done, in flight, next, and what waits on you.
- It starts on "next" without asking you to repeat yourself.
