# prototype

## What it does

`prototype` builds throwaway code that answers one design question — does this
state model hold up, or what should this screen actually look like. It picks
the artifact shape from the question, builds it, hands it to you to drive, and
then folds the answer into the real code.

The code is disposable and is treated that way from the first line: no tests,
no error handling beyond what makes it runnable, no abstractions, no
persistence. What survives is the decision, plus the prototype itself parked on
a throwaway branch as evidence. Nothing built here is meant to be promoted as
written.

## When to reach for it

Type `/prototype`, or the agent reaches for it automatically when a task fits —
"spike this", "try a few versions", "I want to see if this model works".

Reach for it when you have a question you cannot settle by arguing, and code is
the cheapest way to find out. If the question is answerable by reading —
what does this API actually return, which library handles this case — that is
[research](./research.md), and a prototype would be an expensive way to
look something up.

## Two branches, and picking wrong wastes the whole thing

The skill's first move is choosing which question is being asked, because the
two answers produce completely different artifacts:

| The question | What you get |
| --- | --- |
| "Does this logic or state model feel right?" | One self-contained HTML file — free-play buttons plus tabbed guided walkthroughs — that anyone can double-click and drive |
| "What should this look like?" | Radically different UI variations on a single route — three by default, five at most — switchable from a floating bottom bar and a `?variant=` URL param |

When the question is genuinely ambiguous and you aren't around to ask, it
defaults on the surrounding code — a backend module gets the logic branch, a
page or component gets the UI branch — and writes the assumption at the top of
the prototype so you can catch it.

## The logic branch is built for a non-developer

The shareable HTML file is one file with nothing to install, so it can go to a
designer, a PM, or a domain expert by email. Labels are in domain language, not
code. The interesting result is someone saying "wait, that shouldn't be
possible" — that's a bug in the idea, which is the point.

Underneath the page sits a pure module — a reducer, a state machine, or a set
of pure functions — with no DOM access, so that when the question is answered
the validated logic lifts straight into the real codebase. The page around it
is throwaway; that module isn't.

## The UI branch prefers real surroundings

Variants render on an existing route wherever one plausibly exists, keeping the
real header, sidebar, data, and density. A blank throwaway route flatters every
variant equally and hides the problems a populated page would expose. A new
route is the last resort, reserved for a surface that genuinely has nowhere to
live.

Variants have to disagree structurally — different layout, different
information hierarchy, different primary affordance. Three tweaked card grids
is wallpaper, not a prototype. The switcher is hidden in production builds so a
stray merge can't ship it.

## Capture, then delete

When the question is answered, the answer gets recorded — which variant, or
which model, and why — on the issue or in a commit. The prototype itself goes
to a throwaway branch as a primary source, with a pointer to that branch from
the implementation issue. Main keeps only the validated decision. Losing
variants and switchers left in main rot fast and confuse the next reader.

## Common questions

**Can I just ship the winning variant?**

Rewrite it. The variant was written under prototype rules — no tests, minimal
error handling, deliberate shortcuts — so promoting it directly imports all of
that into production. Folding the decision in is the step; copying the file
isn't.

**Why no tests?**

A prototype that needs tests has stopped being a prototype. Tests pin down
behaviour you are still trying to decide, and the artifact is going to be
deleted. If you find yourself wanting them, the question is probably already
answered and the work belongs in the real codebase.

**What if I want the header from B and the sidebar from C?**

That is the expected outcome, not a failure of the exercise — the design you
actually want is usually a recombination. Say so, and the winner folded into
the real code is the combination.

**Does it use my database?**

No, unless persistence is the question. State lives in memory by default,
because a prototype wired to real data is testing your database instead of your
idea. When the question genuinely is about persistence, it uses a scratch
target with an obvious throwaway name.

## It's working if

- You are told, in one line, which question the prototype answers — before any
  code is written.
- You can run it without thinking: double-click a file, or one command from the
  project's task runner.
- The full relevant state is visible after every action or variant switch.
- The variants disagree about structure, not just colour.
- Someone who doesn't read code can drive the logic demo and push back on it.
- When it's over, main contains the decision and none of the prototype.
