# wait-what

## What it does

`wait-what` interrupts the agent and makes it re-pitch the message that just
lost you — the same content, delivered again with context restored and under
tight constraints on how it may be worded.

Nothing about the work changes. This is not a correction, a rollback, or a
disagreement; the agent's plan stands, and the only thing being retried is the
explanation. Which is why it is cheap enough to fire the moment you feel the
thread slip, rather than reading on and hoping the next paragraph rescues it.

## When to reach for it

You invoke this by typing `/wait-what` — the agent won't reach for it on its
own, because nothing in the conversation tells it you stopped following.

Reach for it the first time you lose the thread, not the third. An
explanation you did not follow becomes a plan you cannot review, and every turn
after it builds on a foundation you have not actually checked. If you *did*
follow it and disagree, say so plainly instead — this skill re-pitches, it does
not argue.

## Three constraints, and what each one fixes

| The constraint | The failure it targets |
| --- | --- |
| Give a little context first | The message assumed a chain of reasoning you were never shown |
| Write in ASD-STE100 Simplified Technical English | Long sentences, passive voice, and near-synonyms that each carry a slightly different meaning |
| Use the ubiquitous language from `CONTEXT.md` | The same thing named three ways across one paragraph |

ASD-STE100 is the controlled English written for aircraft maintenance manuals,
where a misread sentence is a safety incident: approved words only, one meaning
per word, short sentences, active voice, one instruction at a time. Asking for
it is more precise than asking for "simpler" — simpler tends to produce the
same explanation with the hard parts removed, whereas a controlled vocabulary
keeps the content and rebuilds the sentences.

The `CONTEXT.md` clause is the one people underrate. Half of what makes an
explanation slippery is drift in the nouns, and a glossary the project already
maintains fixes the names for free. If your repo has no `CONTEXT.md`, the first
sign of trouble is usually that the re-pitch still wobbles between words — see
[domain-modeling](../engineering/domain-modeling.md), which is the skill that
writes that file.

## Common questions

**Why not just say "explain that again"?**

Because that usually returns the same register at greater length, and length is
rarely what was wrong. The named constraints change the register instead: the
re-pitch is shorter than the message it replaces, which is the signal that it
was rebuilt rather than restated.

**Does it undo or change what the agent was doing?**

No. It touches the explanation only. If the re-pitch reveals the plan itself was
wrong — which happens, because a plan that cannot survive Simplified Technical
English often had a soft spot in it — that is a separate instruction you give
afterwards.

**It re-pitched and I still don't follow.**

Fire it again; the second pass has the first re-pitch in context and usually
lands. If two passes fail, the problem is not the wording. Either the underlying
model is genuinely muddled, or you and the agent are using one word for two
things — the case
[domain-modeling](../engineering/domain-modeling.md) exists to resolve.

**Is it rude, or does it cost me anything?**

It costs one turn and no state. The expensive move is the opposite one:
nodding through an explanation you did not follow, then discovering four turns
later that you approved something you never understood.

## It's working if

- The re-pitch is shorter than what it replaces.
- It opens with the context you were missing, not with an apology.
- Each sentence carries one idea, in the active voice.
- One name per concept, and those names match `CONTEXT.md`.
- You can restate the plan in your own words afterwards — which is the actual
  test, not whether the prose reads nicely.
