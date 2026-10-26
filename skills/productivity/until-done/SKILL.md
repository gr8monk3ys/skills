---
name: until-done
description: Keep working toward a goal in a self-paced loop until it clears a written finish line — polished, tested, not AI slop — and send builds as they become ready.
argument-hint: "The goal, e.g. 'the game is beta-ready and could run ads'"
disable-model-invocation: true
---

# until-done

Turn the goal into a finish line, then loop until every line is met and checked. Each firing must be able to pick up cold from the progress file.

## 1. Write the finish line (first firing only)

Turn the argument into 5–10 criteria a stranger could check. Cover:

- **Works** — the core flows run end to end without errors.
- **Looks finished** — art, UI, copy and sound are consistent; no placeholders.
- **Has depth** — enough content or replay value to hold someone.
- **Not slop** — it would not read as template or AI-generated to a buyer.
- **Ships** — it builds, deploys or exports the way the user will use it.

Save the criteria, their status and a dated log to `.claude/progress/<goal-slug>.md` in the project (the session scratchpad if there is no project). Update this file after every step, so a dropped session loses nothing.

## 2. Start the loop

Invoke the `loop` skill without an interval so it self-paces, with `/until-done <the same goal>` as its prompt. Every firing re-enters this skill and reads the progress file.

## 3. Each firing

1. Read the progress file. Pick the unmet criterion with the most value.
2. Do the work. Independent pieces go to subagents, at most 3 at a time.
3. Check it the way the user would: play it, render it, screenshot it, open the page. A criterion met in code that looks cheap on screen is not met.
4. Update the progress file.

Every third firing, review the screenshots and outputs as a harsh critic, looking for template looks, placeholder art, generic copy, repetition and clashing styles. Each problem becomes a criterion.

## 4. Deliver as you go

When a playable build, render, trailer or page is ready, send it with `SendUserFile` (status `proactive`) and a one-line caption. Do not wait to be asked.

## 5. Stop

Stop the loop when one of these is true:

- Every criterion is met and checked. Send the final build and summary.
- Only steps that the user must do remain. List them with exact links.
- Three firings in a row made no progress. Say what is stuck.

If the context grows large, write the state to the progress file and suggest `/pick-up` in a fresh session rather than dragging the context forward.
