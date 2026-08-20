# wizard

## What it does

`wizard` writes an interactive bash script that walks a human through a manual
procedure — provisioning a third-party service, capturing credentials into
`.env` and CI, running a one-off migration or cutover. The script opens each
URL, says what to click and copy, captures the values, and writes them where
they belong.

The agent writes the script and never runs it. You do, on your own machine,
after the agent is done. So a wizard is not a list of steps posted into the
chat — it is a program that holds the procedure and its state, and your part
is to click, paste, and press Enter.

## When to reach for it

Type `/wizard`, or the agent reaches for it automatically when a task fits —
typically when it hits a step it cannot take itself: a key it cannot mint, a
dashboard behind your login, a switch only your account can flip.

Reach for it when the thing blocking progress is a trip through someone else's
UI:

| Situation | What the wizard does |
| --- | --- |
| A new machine needs five services configured before the app boots | Opens each dashboard in order, captures the keys, writes `.env` and the CI secrets |
| A cutover needs switches flipped in a specific order | Sequences the irreversible steps behind confirmation gates |
| You are about to write those steps into the README | Writes an executable version instead |

Don't reach for it for steps the agent can do itself — that is the skill's own
stated boundary, and a wizard around `npm install` is a worse `npm install`.
For a repeated PR-watching or CI-waiting job, that is
[background-automation](./background-automation.md), not a wizard.

## Prerequisites

Nothing to generate one. The generated script needs bash, and `gh` only for
stages that set a GitHub secret or variable. If `gh` is missing or
unauthenticated, those stages warn instead of failing, and the closing summary
lists what you still have to set by hand.

## Stages

A **stage** is one focused task on one screen. The script clears the terminal
between stages, so anything that overflows a stage scrolls away for good — the
skill keeps each one small for that reason, and sets `TOTAL_STAGES` so the
progress counter is honest.

Scoping happens before a line of script is written. The skill reads the repo
rather than asking cold — `.env*`, `README`, `docker-compose*`, framework
config, and every `secrets.*` / `vars.*` reference in `.github/workflows/`,
because each of those is a value the wizard has to produce. It then shows you
the ordered stage list to confirm, and only afterwards maps each stage to the
exact path a human walks ("Dashboard → Developers → API keys → Reveal test key
→ copy"). Where it doesn't know the current UI, it asks or checks the docs
instead of inventing clicks.

For each captured value, scoping settles where it lands:

| Destination | When |
| --- | --- |
| `.env` only | Local dev needs it, CI doesn't |
| GitHub secret | CI reads it, and it's sensitive |
| GitHub variable | CI reads it, and it's public |
| Both | Local dev and CI need it |
| Nowhere | The stage is a pure action — a switch flipped, a plan upgraded |

## The template already solves the UX

[`template.sh`](../../skills/engineering/wizard/template.sh) ships the whole
experience: stage progress, confirmation gates, cross-platform URL opening
including WSL, hidden entry for secrets, idempotent `.env` upserts, `gh secret`
and `gh variable` writes, and a closing summary of everything it had to skip.
Everything above the `STAGES` marker is a fixed library, identical in every
wizard and never hand-edited. Authoring stages is the only work.

Because it opens browsers and blocks on human input, the agent cannot run the
script end to end to check it. It verifies statically instead — `bash -n`,
`shellcheck` where available, and a trace that every value from scoping is
captured, lands where scoping said, and that every `set_secret` name matches a
real `secrets.*` reference in CI. Set expectations accordingly: your first run
is the first real run.

## Common questions

**Do my API keys end up in the model's context?**

No. The agent writes a script; you run it. The script reads secrets with hidden
terminal entry and writes them straight to `.env` or `gh secret`, and the model
is not attached to that terminal. The caveat is values you paste into the chat
yourself while scoping — those are context like any other pasted text.

**Should I commit the wizard?**

Default no. A wizard is built for one run and deleted, and a stale setup script
in the repo is worse than none. Commit it when the setup path is one the next
person on the repo will also walk, and link it from the README so they run the
script instead of re-asking an agent.

**Can I correct a value I mistyped?**

Not mid-run — the stages move forward and there is no back button. Ctrl-C and
re-run instead: every value already written to `.env` is offered back as a
default, so you press Enter through the stages you got right and retype only
the wrong one.

**Does it know what I've already set up?**

It knows what your repo says. It reads your `.env` files and CI references
before scoping, so it asks only for values that are genuinely missing. It does
not check the third-party service — if you created the account but never saved
the key, the wizard still sends you to the dashboard for it.

## It's working if

- You see the ordered stage list, and the values each stage produces, before
  any script exists.
- Every URL is opened before you are asked for the value on that page.
- Secrets are typed blind — nothing sensitive lands in your scrollback.
- Each stage fits one screen; nothing you still needed has scrolled away.
- Ctrl-C and re-run picks up where you left off, offering saved values as
  defaults.
- The final screen lists what it wrote, and separately what it could not do and
  you must finish by hand.
