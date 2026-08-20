# Writing docs pages

Every skill in `skills/engineering/` and `skills/productivity/` — the promoted
buckets — has a human-facing page at `docs/<bucket>/<skill-name>.md`. The docs
tree mirrors those two bucket folders. Skills in `misc/`, `in-progress/`, and
`deprecated/` get no page; none of those buckets ships.

A page is not the skill and not a summary of `SKILL.md`. `SKILL.md` is written
for the agent that executes it. The page is written for the human deciding
whether to reach for it at all. Most of these skills are user-invoked — the
agent will never fire them for you — so you are the index that has to remember
they exist. Relieving that is the page's whole job.

Re-sync a page whenever its skill is added, renamed, or changes behaviour. A
rename moves the file too, and a skill moving between buckets moves its page to
the matching folder. A skill promoted out of `misc/` gains a page; one demoted
into it loses one. `tests/run-all.js` fails the build when pages and promoted
skills disagree.

**Links are repo-relative** — `../../skills/engineering/wizard/SKILL.md`, not a
URL. These pages render on GitHub inside the repo, so an absolute link to a
site we do not publish would simply be wrong. (The upstream guide this is
adapted from mandates absolute URLs because it publishes to aihero.dev.)

**Every page opens with an H1** naming the skill, because ours are standalone
files with no publishing template to supply a title.

## Page structure

Keep this order. `## What it does` and `## When to reach for it` appear on every
page. `## Prerequisites` and the free-form middle carry only what the skill
needs — delete what does not apply.

### `# <skill-name>`

The skill's name, nothing else.

### `## What it does`

One or two plain paragraphs. Lead with the skill's one-sentence job, then state
the **defining constraint**: the single fact that makes it behave differently
from the obvious default. For `research`, that it runs as a background agent
and writes a file rather than answering in chat. For `prototype`, that the
output is throwaway.

Write it as a plain declarative sentence. Never label it ("The key thing is…") —
the formula reads as filler. This is the most valuable line on the page.

### `## When to reach for it`

Two beats:

- **Invocation mode.** User-invoked: "You invoke this by typing `/<name>` — the
  agent won't reach for it on its own." Model-invoked: "Type `/<name>`, or the
  agent reaches for it automatically when a task fits."
- **Trigger boundary.** "Reach for this when …", plus the sibling it is
  confusable with: "for X instead, use [sibling](./sibling.md)."

### `## Prerequisites`

Optional. Include only when the skill needs something in place: a workspace it
writes into, prior setup, or specific tooling. Omit the heading entirely when
the skill runs anywhere.

### Free-form middle

One to three short sections in the skill's own vocabulary that make it click —
the loop it runs, the artifact it produces, the one anti-pattern it kills.
Choose headings that fit; there is no prescribed set.

### `## Common questions`

The questions a reader actually arrives with, answered plainly. Not FAQ
padding — if you cannot think of a real one, the page is not ready.

### `## It's working if`

Observable signs the skill is doing its job, so a reader can tell success from
going through the motions.

## The bar

`What it does` and `When to reach for it` orient the reader. `Common questions`
and `It's working if` are where the page stops summarising and starts answering
the reader's own situation. A page that clears neither is unfinished, not
finished-and-short.
