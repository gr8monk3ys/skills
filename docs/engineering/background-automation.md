# background-automation

## What it does

`background-automation` makes the agent competent with Claude Code's tools for
work that spans time — `/loop`, monitors, background tasks, and PR activity
subscriptions — so waiting on CI, a deploy, or a review doesn't mean sitting in
the session watching it.

Its one hard rule is that the agent never `sleep`s to wait for an external
event. Sleeping burns a turn and the wall-clock time and learns nothing; arming
a monitor or subscribing to PR activity means the event itself wakes the
session. Every other choice in the skill follows from that: the wake signal is
the event, and any polling interval is only a fallback heartbeat for the
transitions that don't arrive as events.

## When to reach for it

It activates on its own. A `UserPromptSubmit` hook scores each prompt against
`hooks/skill-rules.json` and loads the skill when the score clears its
threshold — "every 10 minutes", "watch the deploy", "babysit this PR", a
mention of `monitors.json`, all score.

Type `/background-automation` when you're setting up automation the hook won't
recognise as such, or configuring monitors for a project.

## Picking the primitive

The choice is decided by what you're waiting on, not by preference:

| What you need | Primitive |
| --- | --- |
| A prompt on a fixed cadence | `/loop <interval> <prompt>` — recurring loops expire after 7 days |
| Repetition with no natural interval | `/loop <prompt>` in dynamic mode; the agent picks each delay |
| To wait on an event — CI, a file change, a log line | A persistent monitor; its output arrives as a notification and wakes the loop |
| A long command that shouldn't block | A background task; the agent is re-invoked when it exits |
| To react to PR comments, reviews, or CI | A PR activity subscription, then end the turn |

Two rules govern how they combine. A monitor is armed once — later iterations
list running tasks and skip re-arming rather than stacking duplicates. And when
a monitor is armed, the loop's own interval should be long (20–30 minutes),
because it's now a safety net rather than the mechanism; idle ticks are pure
cost.

## Loops end

A loop has a terminal state and is expected to reach it. "Get CI green" ends at
green; "babysit this PR" ends merged or closed. The failure mode this rules out
is the loop that tries the same fix on each iteration and reports the same
failure forever — every failure is re-diagnosed, and one attempt is not the
task. When you say stop, monitors and subscriptions are torn down rather than
left running.

## Monitors

Monitors are long-lived commands whose stdout is delivered to the session as
notifications, declared in `monitors.json` — in this repo, `.claude/monitors/`,
which ships a `tsc --noEmit --watch` for type errors and a dev-server tail for
runtime ones.

The quality bar for a monitor is that it stays quiet. A watcher that prints on
every keystroke floods the session and makes the real signal unfindable, so
prefer commands that only emit on a genuine state change. Project-specific log
paths need documenting, since the person installing this can't know where your
dev server writes.

## Commands it pairs with

- [`/babysit`](../../commands/babysit.md) — the worked example: a PR
  subscription for the wake signal, a `tsc --watch` monitor for local signal,
  and a ~20 minute fallback heartbeat for what webhooks miss.
- [`/automerge`](../../commands/automerge.md) — the endpoint a babysitting loop
  is usually driving toward.
- [`/fixissue`](../../commands/fixissue.md) — issue to merged PR, which spends
  most of its life waiting on CI.
- [`/verify`](../../commands/verify.md) — the check a cadence loop typically
  runs.

## Common questions

**What's actually wrong with polling every thirty seconds?**

Each tick is a real turn with real cost, and the run is usually pure overhead —
nothing changed. An event-driven wake gets you the result sooner and the idle
ticks disappear, which is why the fallback interval gets *longer* once a monitor
is armed, not shorter.

**Will a loop run forever if I forget about it?**

Recurring loops expire after seven days, and a well-formed loop stops at its own
terminal state before that. Saying stop tears down the monitors and
subscriptions too, so nothing keeps waking the session afterwards.

**Do these primitives exist everywhere?**

Not necessarily. The `/babysit` command is written to use whichever of the three
the current environment exposes, rather than assuming all of them — so treat
availability as something to check rather than rely on. Where subscriptions
aren't offered, the same job still runs as a loop with a shorter heartbeat, at
higher cost per result.

**Can I watch something that isn't CI?**

Yes — a monitor is any long-running command. Typecheckers, dev-server logs, test
watchers, a `tail -F` on anything. The constraint is noise, not the source.

## It's working if

- The session ends its turn and comes back when something happened, rather than
  ticking through unchanged states.
- No `sleep` appears anywhere in the waiting.
- One monitor per thing being watched, however many iterations the loop runs.
- Once a monitor is armed, the loop's fallback interval gets longer.
- Each failure gets diagnosed afresh instead of the same fix being retried.
- The loop stops on its own when the PR merges or CI goes green — and stops
  immediately when you ask.
