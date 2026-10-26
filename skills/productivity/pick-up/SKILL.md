---
name: pick-up
description: Resume work from a paused or separate session — find it, check where it really stopped, and continue without re-asking what was already answered.
argument-hint: "Which work, e.g. 'hollow crown' or 'all Monkey SMP sessions'; add 'recap only' to stop after the recap"
disable-model-invocation: true
---

# pick-up

Find the earlier work, rebuild its state from evidence, and keep going.

## 1. Find it

Search for the topic in the argument, most recent first. Look in:

- Session tools, when the app has them: list sessions, search session transcripts, read a session's events.
- Transcripts at `~/.claude/projects/<folder>/*.jsonl` (the folder name is the working path with separators turned into dashes).
- Handoff documents in the OS temp directory.
- Progress files at `.claude/progress/*.md` in the project.
- Git: branches, worktrees and open PRs that name the topic.

When several sessions match the topic, take all of them.

## 2. Read the tail

For each match, find the last thing the user asked for, the last report, the plan or todo list, the branch or worktree, and the decisions the user already made.

## 3. Check the real state

A session's report is a claim, not proof. Check git status and log on its branch, PR and CI state, and whether processes or jobs it started still run.

## 4. Recap in five lines

Goal · done · in flight · next · waiting on the user.

## 5. Continue

Unless the argument says "recap only", start on "next" now.

- If the paused work lives in sessions that still exist, resume each in place by messaging it to continue, rather than redoing its work here.
- Otherwise continue in this session.
- Never ask a question that the earlier session already got an answer to.
