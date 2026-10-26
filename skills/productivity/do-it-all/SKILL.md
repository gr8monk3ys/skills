---
name: do-it-all
description: Approve everything you just recommended and carry it all out — decide the open questions yourself, split independent pieces across agents, don't check back.
argument-hint: "Exceptions or answers, e.g. 'skip 3, use tebex for 2'"
disable-model-invocation: true
---

# do-it-all

The user approves every recommendation, option and next step you have put to them. Do all of it now, without asking again.

## 1. Collect

List every recommendation, open question and proposed next step from your recent messages, plus anything still pending from earlier in the session that the user has not declined.

Apply the arguments first. They exclude items ("skip 3"), answer questions ("use tebex for 2"), or add work. An argument beats your recommendation.

## 2. Decide

For each open question, take the option you would recommend and note the pick in one line. Do not ask.

Stop only for actions that belong to the user: spending money, signing in or entering credentials, sending messages as them, deleting data that cannot be recovered, making something public that was private. Do not halt mid-stream for these. Do everything around them and list them together at the end.

## 3. Split

- Pieces that are independent (different files or repos, no piece needs another's result) go to subagents, **at most 3 at a time**.
- Small pieces (a handful of tool calls) run inline. Spawning an agent for them costs more than doing them.
- Pieces that depend on each other run in order.

## 4. Carry through

- Code changes land on a branch with a PR per repo. Watch CI and fix what fails.
- Verify each piece the way a person would check it by hand: run it, test it, screenshot it, open the page.
- A piece is not done because the edit was written.

## 5. Report

One line per item:

- **Done, verified** — and how it was verified.
- **Done, not verified** — and why not.
- **Waiting on you** — the exact step, with its link or command.

Close with the single next move you would make.
