---
name: background-automation
description: |
  WHEN to auto-invoke: Setting up recurring or self-paced tasks, watching CI or deploys, babysitting pull requests, configuring monitors, running long jobs in the background, scheduling check-ins, polling for a condition, or wiring Claude Code on the web/cloud sessions and PR activity subscriptions.
  WHEN NOT to invoke: One-off synchronous edits, writing application feature code, pure UI/styling work, or anything that finishes in a single turn with no waiting.
allowed-tools: Read, Bash, Grep, Glob
---

# Background Automation Skill

You are an expert at Claude Code's automation primitives: loops, monitors, background
tasks, and PR activity subscriptions. Use them to do work that spans time or waits on
external events — without burning turns on `sleep`.

## Pick the right primitive

| Need | Use | Notes |
| --- | --- | --- |
| Run a prompt on a fixed cadence | **`/loop <interval> <prompt>`** | e.g. `/loop 10m /verify`. Recurring loops auto-expire after 7 days. |
| Self-paced repetition with no fixed interval | **`/loop <prompt>`** (dynamic mode) | You decide the next delay each iteration. |
| Wait on an event (CI, file change, log line) | **Monitor** (`persistent: true`) | Events arrive as notifications and wake the loop immediately — do not poll. |
| Run a long command without blocking | **Background task** (`run_in_background`) | You are re-invoked when it exits; check output later. |
| React to PR comments / reviews / CI | **PR activity subscription** | Subscribe, then end the turn; events wake the session. |

## Rules that matter

1. **Never `sleep` to wait for an external event.** Arm a monitor or subscribe; let the
   event wake you. `sleep` just burns a turn and the wall-clock cost.
2. **A monitor is the wake signal; the loop delay is only a fallback heartbeat.** When a
   monitor is armed, lean on a longer fallback (≈20-30 min) — idle ticks past the cache
   window are pure overhead.
3. **Arm a monitor once.** On later iterations, list running tasks first and skip
   re-arming if one already exists.
4. **Loops have a terminal state.** "Get CI green", "babysit this PR" — drive to
   merged/closed. Re-diagnose on every failure; one attempt is not the task.
5. **Stop when asked.** Tear down monitors and subscriptions the moment the user says
   stop.

## Monitors config

Background watchers live in `monitors/monitors.json` (in this plugin, under
`.claude/monitors/`). Each entry runs a long-lived command; its stdout lines are
delivered to the session as notifications.

```json
[
  {
    "name": "typecheck-watch",
    "command": "npx tsc --noEmit --watch --pretty false",
    "description": "Streams TypeScript errors as you edit",
    "when": "always"
  }
]
```

- Keep monitors low-noise: a watcher that emits on every keystroke will flood the
  session. Prefer commands that only print on a real state change (errors, failures).
- `when` gates activation (`always`, or a condition). Document any project-specific log
  paths users must adjust.

## Recipes

**Watch a deploy until it settles**

```text
/loop check the Vercel deploy for this branch every 10m
```

**Babysit a PR to green** — subscribe to PR activity, arm a `tsc --watch` monitor for
local signal, and set a ~20m fallback heartbeat for the transitions webhooks miss (CI
success, merge-conflict). See the `/babysit` command, which wires this together.

**Long test/build run** — start it as a background task and continue other work; handle
the result when you are re-invoked on exit.
