# what-else

## What it does

`what-else` answers "what else can we do?" by comparing the project against the
best examples of its kind — the top servers, the best-rated games in the genre,
the leading products — and returning a ranked gap table of next moves.

It researches before it suggests and builds nothing. Every idea is tied to
something a best-in-class example actually does, and nothing already built is
proposed again.

## When to reach for it

You invoke this by typing `/what-else` — the agent won't reach for it on its own.
Pass the subject or angle: `/what-else the discord server`, `/what-else retention`.

Reach for it when the obvious work is done and you want the next tier. To judge
how good or finished the current state is, rather than what to add, use
[brutal](./brutal.md).

## The gap table

Each row is an idea with what the best do, what this project has, impact,
effort, and who can do it — Claude with the tools at hand, or you. The top five
get a short "how", and at least one idea is deliberately bold.

## Common questions

**Why not just brainstorm?**

A brainstorm from memory produces generic ideas and repeats features you
already have. Benchmarking against named examples makes each idea concrete and
checkable.

**What happens after the list?**

Nothing until you say so. `/do-it-all` takes every Claude row; naming numbers
takes some.

## It's working if

- Each idea cites a real example and source.
- Nothing on the list already exists in the project.
- Ideas you would need to do yourself are marked as yours.
