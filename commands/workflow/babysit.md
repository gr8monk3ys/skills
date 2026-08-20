---
description: Watch a PR in a loop and auto-fix CI failures and review comments
argument-hint: "<pr-number|url> [--no-fix]"
allowed-tools: Read, Edit, Bash, Grep, Glob
disable-model-invocation: true
model: claude-sonnet-4-6
---

Babysit a pull request until it is green and merged: keep watching CI, deploys, and
review comments, and push fixes as they come in.

## Target

$ARGUMENTS

## How this works

This command leans on three Claude Code automation primitives. Use whichever the current
environment exposes.

| Primitive | Use it for |
| --- | --- |
| **PR activity subscription** | The primary wake signal. Subscribe to the PR so CI results, reviews, and comments arrive as events instead of being polled. |
| **`/loop`** | The fallback heartbeat. Re-check state on an interval when no event has fired (CI success and merge-conflict transitions are not always delivered as events). |
| **Monitors** | Local signal. Watch `tsc --watch` / dev-server output so type and runtime errors surface before they reach CI. |

### On a cloud / web session

1. Resolve the PR number from `$ARGUMENTS` (accept `#123`, `123`, or a full URL).
2. Subscribe to PR activity for that PR, then end the turn. Do **not** poll with
   `sleep` — events wake the session.
3. As a safety net (CI-success and conflict transitions are not always delivered),
   arm a periodic self-check, e.g.:

   ```text
   /loop check PR #123: re-read CI + mergeability, fix anything red, every 20m
   ```

### On a local session (no webhook bridge)

Run the watch as a self-paced loop:

```text
/loop check PR #123 every 5m
```

## On each wake — the fix loop

1. **Read state.** Fetch the PR's CI status, review threads, and mergeability.
2. **Triage each signal:**
   - **CI failure** → open the failing job logs, reproduce locally
     (`npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test`), fix the
     root cause, and push.
   - **Review comment** → if the fix is unambiguous and small, apply and push. If it is
     ambiguous or architectural, ask the human instead of guessing.
   - **Merge conflict** → rebase onto the base branch, resolve, push with
     `--force-with-lease`.
   - **Green + approved + mergeable** → report that it is ready (and merge only if the
     user asked you to).
3. **Re-arm.** Reset the heartbeat and keep the subscription alive. The loop is not done
   until the PR is **merged** or **closed**.

## Flags

| Flag | Effect |
| --- | --- |
| `--no-fix` | Report status and diagnosis only; never push changes. |

## Guardrails

- Re-diagnose every failure from scratch; one fix attempt is not the task.
- Never force-push to a protected base branch; only to the PR's own head branch.
- Stop immediately when the user says stop — unsubscribe and push nothing further.
- Don't narrate every round of fixes. The PR diff is the record; reply only when the
  task is resolved or you are blocked.
