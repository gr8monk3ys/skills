---
name: full-review
description: The full quality pass — code review, security review and architecture review on the current repo, then fix everything they find and open a PR.
argument-hint: "Scope: a path, a branch, 'since main', or empty for the whole repo"
disable-model-invocation: true
---

# full-review

Run three reviews, merge their findings, fix them all, ship one PR. The user's standing answer to every review question is "whatever you recommend".

## 0. Setup

- Work on a fresh branch (in a worktree when other sessions share the checkout).
- If the repo has no `docs/agents/` folder, run `mattpocock-skills:setup-matt-pocock-skills` first. Take its defaults; do not ask.

## 1. Review

Run all three on the scope in the arguments (empty = whole repo):

1. `code-review` — correctness bugs.
2. `security-review` — vulnerabilities.
3. `mattpocock-skills:improve-codebase-architecture` — deepening opportunities.

Some of these are user-invocable only. When the Skill tool refuses one, find its `SKILL.md` under `~/.claude/plugins` and follow it inline.

On a large repo, run the three as parallel subagents that return findings only. On a small one, run them inline.

## 2. Merge

Make one list. Remove duplicates. Open the code behind each finding and drop the ones that are false. Rank by severity: security, correctness, then architecture.

## 3. Fix

- Fix every confirmed security and correctness finding.
- For architecture candidates, implement those with a clear payoff. Answer the grilling questions yourself with the recommended option, and record each answer in the PR.
- Skip a finding only with a stated reason.

## 4. Verify

Run the repo's own checks: build, types, lint, tests. Add a test for each correctness fix where the repo has tests. Nothing ships red.

## 5. Ship

Open one PR with a table: finding, file, severity, fixed or skipped (with reason). Watch CI and fix failures until it is mergeable. Report the PR link and its state.
