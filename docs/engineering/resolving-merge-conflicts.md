# resolving-merge-conflicts

## What it does

`resolving-merge-conflicts` takes a merge or rebase that has already stopped on
conflicts and drives it to a finished commit — reading each side, resolving
every hunk, running the project's checks, and completing the merge or the rest
of the rebase.

It never aborts. `git merge --abort` is off the table by instruction, so the
skill cannot get halfway and hand you back the pre-merge state; whatever it
starts, it finishes. That is the fact to know before invoking it on a conflict
you are not sure you want to resolve.

## When to reach for it

Type `/resolving-merge-conflicts`, or the agent reaches for it automatically
when a task fits — conflict markers in a file, a `CONFLICT (content)` line, a
stopped rebase.

Reach for it when you are already mid-conflict and the two sides both did
something real, so choosing one wholesale would drop work. For a merge you have
not started yet, or one you would rather not finish, abort or reset it
yourself first — the skill's job starts after `git merge` has stopped.

## It resolves from intent, not from markers

The step that makes the difference happens before any hunk is edited: for each
conflict, the skill goes and finds why each side was written. Commit messages,
the PR that carried the change, the issue behind it. Only then does it resolve.

That ordering is what separates it from picking `ours` or `theirs` and moving
on. Conflict markers show two versions of some lines; they say nothing about
which behaviours were deliberate. When both intents can survive, it keeps both.
When they genuinely cannot, it picks the one matching what the merge is for and
records the trade-off instead of burying it.

It is also barred from inventing new behaviour at a conflict. A resolution that
is neither side is how a merge quietly ships a change nobody wrote or reviewed.

## The checks are part of the resolution

Before finishing, it finds the project's own automated checks — typecheck,
tests, formatter — runs them, and fixes what the merge broke. A conflict
resolution that compiles by eye and fails on CI has not resolved anything, and
this is the step that catches the semantic conflicts that leave no markers: both
sides edited different files, both are syntactically fine, and together they
don't work.

## Common questions

**Why is aborting off the table?**

Because "I'll deal with it later" is how a long-lived branch drifts further from
main and makes the next attempt worse. If you want the merge abandoned, that's
a decision to make before invoking, not a fallback for the skill to reach for
when a hunk is hard.

**Does it prefer my branch or the one I'm merging in?**

Neither by default. Preserving both intents is the first choice. Where the
changes are genuinely incompatible it picks the side matching the merge's stated
goal — which is why saying what the merge is for makes the resolutions better.

**Can I trust it on a conflict with real logic in it?**

Read the resolutions on the hunks that carry behaviour. The tell for a good one
is that it can say what each side was trying to do; the tell for a bad one is a
resolution containing something neither branch had. The project's checks running
green is a floor, not a review.

**It's a rebase with a dozen commits — does it get through all of them?**

Yes, that's the terminal state: it continues the rebase until every commit is
replayed, rather than stopping at the first conflicted commit.

## It's working if

- It tells you why each side of a hunk exists before telling you how it
  resolved it.
- Resolutions keep both behaviours wherever both can survive.
- Anywhere a behaviour was dropped, you're told which one and why.
- No resolved hunk contains code that appears in neither branch.
- The project's typecheck, tests, and formatter all run before the merge is
  committed.
- The merge or rebase ends finished — not aborted, not left staged for you.
