# domain-modeling

## What it does

`domain-modeling` builds and sharpens the vocabulary a project runs on. It
challenges terms as you use them, invents scenarios that force the boundaries
between concepts to be precise, checks your description against what the code
actually does, and writes the resolutions into `CONTEXT.md` and — rarely —
an ADR.

It is the active discipline, not the reading one. Consulting `CONTEXT.md` for
the right word is a habit any skill can have; this skill is for when the model
itself is changing. And it writes the moment a term is settled, mid-conversation,
rather than batching a documentation pass at the end — because the definition
you can still remember arguing about is the one worth recording.

## When to reach for it

Type `/domain-modeling`, or the agent reaches for it automatically when a task
fits — a design discussion where the nouns are in play, editing `CONTEXT.md`, or
recording a decision.

Reach for it when you notice the same thing being called two names, or one name
covering two things. For writing agent-facing documents themselves — skills,
`AGENTS.md`, `CLAUDE.md` — use
[writing-for-agents](../productivity/writing-for-agents.md); that skill governs
how you write for an agent, this one governs what the words mean.

## What it does to you mid-conversation

Four moves, all interruptions by design:

| It notices | It says |
| --- | --- |
| Your word conflicts with the glossary | "Your glossary defines cancellation as X, but you mean Y — which is it?" |
| Your word is vague or overloaded | "You're saying account — Customer or User? Those are different things." |
| A relationship is being asserted | A concrete scenario that probes the edge, forcing you to be precise |
| Your description and the code disagree | "Your code cancels whole Orders, but you said partial cancellation exists" |

The last one is the one that catches real bugs. A model everyone believes in and
no code implements is a bug with a long fuse.

## `CONTEXT.md` is a glossary and nothing else

The format is deliberately small: a term, one or two sentences saying what it
*is* — not what it does — and an `_Avoid_` line naming the words this project
does not use for it. Being opinionated is the point; when three words exist for
one concept the file picks one and demotes the rest.

What does not go in: implementation details, specs, decisions, scratch notes,
and general programming vocabulary. Timeouts and error types are not domain
terms even in a project full of them. The file only earns its place if reading
it teaches you this project's language rather than restating programming.

Files are created lazily — no `CONTEXT.md` until the first term is worth
writing down. Repos with more than one context get a `CONTEXT-MAP.md` at the
root pointing at each one and describing how they relate.

## ADRs are rationed

An ADR is offered only when all three are true:

1. **Hard to reverse** — changing your mind later costs something real.
2. **Surprising without context** — a future reader will ask why on earth.
3. **A real trade-off** — genuine alternatives existed and one was chosen.

Miss any of the three and there is no ADR. Easy to reverse means you'll just
reverse it; unsurprising means nobody will wonder; no alternative means the
record would say "we did the obvious thing."

The template is one to three sentences: the context, the decision, the reason.
Status, considered options, and consequences are optional and usually omitted.
The value is in recording that a decision happened and why — not in filling out
a form, which is how ADR practices die.

## Common questions

**Isn't this just documentation I'll never read?**

The glossary is read constantly, by agents — it's the file that stops your
codebase drifting between `client`, `customer`, and `account` across three
modules. It stays short precisely so that stays true; an eighty-term glossary
covering general programming concepts is the failure mode.

**Why does it keep interrupting to argue about a word?**

Because that is the cheap moment. A term settled in conversation costs a
sentence; the same ambiguity settled after it's in type names, table columns,
and API routes costs a migration.

**Should every decision get an ADR?**

No, and offering one for everything is how the practice becomes noise nobody
reads. The three-part gate exists to say no most of the time — architectural
shape, lock-in technology choices, boundary decisions, and deliberate deviations
from the obvious path are what qualify.

**My repo has several services — one glossary or many?**

Many, with a `CONTEXT-MAP.md` at the root listing each context, where it lives,
and how they relate. Separate contexts are allowed to disagree about a word;
that's what makes them separate contexts, and the map is where the relationship
between them is recorded.

## It's working if

- You get pushed back on a term mid-design, before it reaches a type name.
- `CONTEXT.md` grows a term at the moment it's settled, not in a later pass.
- Definitions say what a thing is, in one or two sentences, with the rejected
  synonyms listed.
- The glossary contains nothing you could have learned from a language tutorial.
- Most decisions do not produce an ADR, and the ones that do are a paragraph.
- Someone points at code that contradicts the model, and it turns out the code
  was wrong.
