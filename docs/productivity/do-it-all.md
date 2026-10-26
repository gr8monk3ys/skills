# do-it-all

## What it does

`do-it-all` is a blanket yes. It approves every recommendation, option and next
step the agent has put to you, and the agent carries all of it out: open
questions get the option it would have recommended, independent pieces go to
subagents, and each piece is checked by hand before it counts as done.

It does not re-ask. The only things it stops for are the ones that are yours by
nature — money, sign-ins, messages sent as you, unrecoverable deletes, making
something public — and even those are collected into one list at the end rather
than interrupting the run.

## When to reach for it

You invoke this by typing `/do-it-all` — the agent won't reach for it on its own.

Reach for it right after the agent ends a message with a list of options or
"want me to…?" and your answer is "whatever you recommend, all of it". Pass
arguments to carve out exceptions: `/do-it-all skip 3, use tebex for 2`. To
pick a few items instead of all, just name them in plain text.

## How it splits the work

| Piece | Where it runs |
| --- | --- |
| Independent of the others, real work | A subagent, at most three at once |
| A handful of tool calls | Inline — an agent costs more than the work |
| Needs another piece's result | In order, after it |

The three-agent cap is deliberate: subagent fan-out has been the largest share
of weekly usage, so the skill parallelises only where it buys time.

## Common questions

**Will it spend money or sign in as me?**

No. Those are listed at the end as steps for you, with links.

**What if I disagree with one of its picks?**

Every pick is written down in one line, so you can see it and reverse it. The
argument is the cheaper route: answer the question up front and it never has
to guess.

## It's working if

- You get one report at the end, not a stream of "should I…?" questions.
- Each item is marked verified, unverified with a reason, or waiting on you.
- Code changes arrive as PRs with CI green.
