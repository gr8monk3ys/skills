# ask-lorenzo

## What it does

`ask-lorenzo` is the router over this plugin. You describe what you're trying
to do; it names the one command or skill that fits, says why, and hands off.

It never does the work. That constraint is what makes it cheap to ask — the
answer is a pointer, not a half-finished attempt at your task, so a wrong
answer costs you a sentence. The agent is also barred from firing it, which for
a router is the point: one that volunteered itself would sit in front of every
request, adding a hop to work the agent could already have started.

## When to reach for it

You invoke this by typing `/ask-lorenzo` — the agent won't reach for it on its
own.

Reach for it when you know roughly what you want and not what it's called: 17
commands and 14 skills is more than anyone keeps in their head, especially the
ones you use twice a month. If you already know the command, type it; routing
to a name you have is pure overhead.

## The map, in four groups

The router's own map is worth skimming once, because knowing the shape means
you'll only need it for the edges.

**Scaffold something new.** `/component-new`, `/hook-new`, `/page-new` for
React and Next.js; `/api-new`, `/action-new`, `/edge-function-new` for
endpoints; `/rls-new` and `/types-gen` for Supabase; `/test-new` for tests;
`/deploy` for deployment config. Behind those, three skills raise the standard
of everything you write in each area: [api-development](./api-development.md),
[frontend-development](./frontend-development.md), and
[database-operations](./database-operations.md).

**Check or fix quality.** `/lint` for lint and autofix, `/verify` for the full
six-phase loop, `/review` for the gates before you call something done,
`/api-test` to exercise endpoints.

**Deliver.** `/fixissue` takes a GitHub issue end to end; `/babysit` watches a
PR and fixes CI as it fails; `/automerge` validates, merges, and cleans up. The
primitives underneath are [background-automation](./background-automation.md).

**Work the workflow.** [wizard](./wizard.md) for steps only a human can take,
[resolving-merge-conflicts](./resolving-merge-conflicts.md) mid-merge,
[prototype](./prototype.md) to answer a design question with throwaway code,
[research](./research.md) to investigate against primary sources,
[domain-modeling](./domain-modeling.md) to sharpen the project's vocabulary,
and [writing-for-agents](../productivity/writing-for-agents.md) when the thing
you're writing is itself read by an agent. Alongside those sit the rest of the
productivity set — [handoff](../productivity/handoff.md) to end a session
another agent can continue, [wait-what](../productivity/wait-what.md) when a
message didn't land, and
[to-questionnaire](../productivity/to-questionnaire.md) for a decision only
someone else can make.

Process discipline — brainstorming, TDD, systematic debugging, writing plans,
code review — is not here. The superpowers plugin owns it, and the router sends
you there rather than offering a weaker local version.

## Common questions

**Why ask a router instead of just describing the task?**

Describing the task usually works — the model-invoked skills fire on their own.
The gap the router fills is the user-invoked ones, which nothing will surface
for you, and the cases where two things nearly fit and the difference matters:
prototype versus research, `/verify` versus `/review`.

**Will it give me options to choose from?**

One recommendation, and a second only when it's genuinely torn. A menu just
moves the decision back to you, which is what you asked it to take.

**What if nothing in the plugin fits?**

It says so plainly rather than routing you to the nearest match. A router that
always finds something is a router you stop trusting on the third bad answer.

**How does it stay accurate?**

By being re-read and updated whenever a user-reachable command or promoted skill
is added, renamed, removed, or changed — the repo treats that as part of the
change, not as follow-up. The router is also told to speak up if it notices
drift between its map and what's actually installed.

## It's working if

- You get one name, a reason, and a handoff — not a menu and not an attempt at
  the work.
- The reason names the distinction that decided it, so you learn the boundary
  and don't need to ask again for that pair.
- "Nothing here fits" comes back sometimes, and it points outside the plugin
  when that's the honest answer.
- You need it less over time.
