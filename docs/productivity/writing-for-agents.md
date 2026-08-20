# writing-for-agents

## What it does

`writing-for-agents` is the reference for writing anything an agent reads — a
skill, an `AGENTS.md` or `CLAUDE.md`, a doc reached by a pointer from one of
those. The packaging differs between them; the writing does not.

What it optimises for is the agent taking the same *process* every run, not
producing the same output. That reframes every editing decision, because the
test for a line stops being "is this clear?" and becomes "does this change
behaviour versus what the model already does by default?" A sentence that reads
well and instructs the model to do what it was going to do anyway is a no-op:
it costs context on every turn and buys nothing. Most of this skill is the set
of levers that survive that test, and the habits of pruning that find the lines
that don't.

## When to reach for it

Type `/writing-for-agents`, or the agent reaches for it automatically when a
task fits — creating or editing a skill, or modifying `AGENTS.md` or
`CLAUDE.md`.

Reach for it when the document you are writing will be consumed by an agent
rather than a person, and especially when an existing one is behaving
inconsistently — firing sometimes and not others, or skimming a step it should
be doing thoroughly. For the words themselves, use
[domain-modeling](../engineering/domain-modeling.md): that skill governs what a
term means in this project, this one governs how the document around it is
built.

## The two loads

Every document, and every pointer to one, spends one of two budgets:

- **Context load** — the cost of always-loaded material on the agent's window: a
  line in `CLAUDE.md`, a model-invoked skill's description. It spends tokens and
  attention on every single turn, whether or not it ever fires.
- **Cognitive load** — the cost on you: knowing which documents exist and when
  to reach for each. This one is not to be minimised. It is the price of human
  agency, and the call is where to spend it — on the decisions where your
  judgement matters — and where to remove it.

Material behind a pointer escapes context load for the price of the pointer's
own line. Material with no pointer at all rides entirely on you. When
user-invoked skills pile up past what you can hold, the cure for that
accumulated cognitive load is a router — which is what
[ask-lorenzo](../engineering/ask-lorenzo.md) is.

## Where each piece sits

A document mixes two content types freely: **steps**, the ordered actions the
agent performs, and **reference**, the definitions and rules it consults on
demand. The decision is which rung of the information hierarchy each piece sits
on, ranked by how immediately the agent needs it:

1. **In-file step** — the primary tier, what the agent does, in order.
2. **In-file reference** — consulted on demand. A flat set of peers here (every
   rule of a review on one rung) is a legitimate shape, not a smell.
3. **Disclosed reference** — pushed into a separate file behind a pointer,
   loaded only when the pointer fires.

**Progressive disclosure** is the move down that ladder, and branching is the
cleanest test for it: inline what every branch needs, push behind a pointer what
only some branches reach. Get it wrong in either direction and it hurts — push
too little and the top bloats, push too much and you have hidden material the
agent needed. When a document has steps, undisclosed reference buries them and
turns attending to them into a coin flip.

Two failure modes live beside this. **Sprawl** is a document simply too long
even when every line is live: attention thins across the excess. And where the
ladder decides how far down a piece sits, **co-location** decides what sits
beside it — a concept's definition, rules, and caveats under one heading, so
reading one part brings its neighbours along.

## The levers that change how it runs

**Completion criteria.** Every step ends on a condition that tells the agent it
is done, and two properties of that condition do the work. *Clarity* — can it
tell done from not-done? A fuzzy bound invites premature completion, the agent's
attention sliding toward being finished while visible later steps pull it
forward. *Demand* — how much the condition requires. "Every modified model
accounted for" forces digging that "produce a change list" does not, and demand
is not step-bound: "every rule applied" holds a flat body of reference to the
same bar.

**Leading words.** A leading word is a compact concept the model already holds
from pretraining — *lesson*, *fog of war*, *tracer bullets* — repeated as a
token rather than restated as a sentence, so it accumulates a distributed
definition and anchors a region of behaviour cheaply. "Fast, deterministic,
low-overhead" collapses into *tight*. Coining your own works if you define it,
but an invented word recruits no priors: you pay in definition tokens what an
existing word gives free.

**Prompt the positive.** Steering by prohibition drags the forbidden behaviour
into context and makes it more available, not less — the negation is a weak
modifier over a strongly activated concept, so a ban half-reads as an
instruction. State the target behaviour so the banned one is never spoken. A
prohibition earns its place only as a hard guardrail you cannot phrase
positively, and even then it should carry the positive target alongside it.

## Common questions

**How do I decide whether a skill is user-invoked or model-invoked?**

By whether the agent — or another skill — must be able to reach it on its own.
A description is permanent context load in exchange for that reach; if the skill
only ever fires because you typed its name, make it user-invoked and pay
nothing. That branch, along with frontmatter and router skills, lives in
[`SKILL-MECHANICS.md`](../../skills/productivity/writing-for-agents/SKILL-MECHANICS.md).

**My skill fires inconsistently — should I inline the material instead?**

Sharpen the pointer first. The pointer's *wording*, not its target, decides when
the agent reaches material and how reliably — so a must-have target behind a
weakly worded pointer is a wording bug, and inlining it treats the symptom at
permanent cost. Front-load the leading word, give one trigger per branch, and
cut identity the body already carries. Inline only when sharpening has actually
failed.

**Should the document restate the commands in `package.json`?**

The environment is a source of truth too — scripts, config, directory layout,
`--help` output — and a document repeating it is a cache of a lookup. A cache
earns its load only when the lookup is expensive, so cache the unwritten
convention, the reason behind a choice, the gotcha no config confesses, and
leave one-command lookups where they cannot go stale.

**Two of us disagree about whether a line is doing anything.**

Then you disagree about the model's default, and the test is model-relative
rather than reader-relative: run the document without the line and see. This is
worth settling rather than splitting the difference, because the default fate of
an unpruned document is sediment — stale layers that accumulate because adding
feels safe and removing feels risky.

**Does any of this apply to `CLAUDE.md`, or is it a skills thing?**

All of it except the frontmatter. `CLAUDE.md` is the most expensive document you
own — always loaded, every turn, every session — so the no-op test and the
pruning discipline bite harder there than anywhere else.

## It's working if

- Lines get deleted whole, rather than trimmed, when they fail the no-op test.
- A repeated triad or a sentence gesturing at one idea gets replaced by a single
  word you then reuse.
- Every step ends on something the agent can actually check, and the demanding
  ones say so.
- What only some runs need sits behind a pointer; what every run needs is
  inline.
- Instructions name the behaviour you want, and prohibitions are rare enough to
  notice.
- A skill that used to fire unpredictably fires because its pointer changed, not
  because its body got longer.
