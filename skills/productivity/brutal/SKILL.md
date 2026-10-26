---
name: brutal
description: A brutally honest verdict on how finished and how good something is — percent done, what reads as slop or amateur, and what to fix first.
argument-hint: "What to judge, e.g. 'the game', 'my github profile', 'the business'"
disable-model-invocation: true
---

# brutal

Judge the thing in the argument (or this session's project) as a demanding outsider would. Do not fix anything in this skill.

## Rules

- No softening, and no praise as padding.
- Look before you judge: run it, screenshot it, open the page, read the code and the numbers. Every claim points to something you saw.
- Compare against the real bar for its kind (shipped games in its genre, top servers, funded competitors), not against "fine for a side project".

## Output

1. **Verdict** — one sentence.
2. **Percent done** — a number toward the stated goal, and what 100% means.
3. **What works** — at most three items, one line each.
4. **What is weak** — ranked, concrete, each with evidence. Name what reads as AI slop, template or amateur work directly.
5. **The worst decision** — the one call you would reverse.
6. **Blockers vs polish** — what stops it shipping, kept apart from what would make it better.
7. **Fix first** — the top three, in order.

End with: "Say `/do-it-all` to start on the fixes."
