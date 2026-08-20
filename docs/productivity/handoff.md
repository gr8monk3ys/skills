# handoff

## What it does

`handoff` compresses the conversation you are currently in into a single
Markdown file that a fresh agent can read to carry the work on — what is in
flight, what is next, and which skills the next agent should reach for.

The file is written to your operating system's temporary directory, never into
the workspace. That one placement decision is the skill: a handoff is a transit
document with a short life, not an artifact you keep and maintain. The same rule
runs through the content — specs, plans, ADRs, issues, commits and diffs are
referenced by path or URL rather than copied, so the settled detail stays in the
one place that owns it and the handoff carries only the live thread.

## When to reach for it

You invoke this by typing `/handoff` — the agent won't reach for it on its own.
Pass a note about what the next session is for, and the document is aimed at
that instead of summarising evenly.

Reach for it when the work has to move somewhere your current context cannot
follow: a different harness, a different repo, a colleague, or a second agent
you want running in parallel while you stay where you are. When nothing is
moving — same session, same directory, you are just deep in context — `/compact`
does the job with less ceremony, and `/clear` plus a written brief does it when
nothing behind you is worth keeping.

## What travels, and what doesn't

| Goes in | Stays out |
| --- | --- |
| The state of the work in flight and why | Anything already written down elsewhere |
| What the next agent should do first | Narration of how the session got here |
| A suggested-skills section naming what to call | Keys, tokens, passwords, personal data |

The suggested-skills section is the part most easily skipped and the part that
saves the most: a fresh agent has no memory of the routine you settled into, so
naming the skills explicitly is what stops it re-deriving an approach you
already rejected.

## Common questions

**Handoff or `/compact`?**

`/compact` unless something is travelling. They preserve different things —
`/compact` keeps your intent alive in a fresh window, `/handoff` produces a file
that can be carried to a machine, harness, or person the window cannot reach.
The file is not a better summary; it is a portable one.

**How do I actually give it to the next agent?**

Point the new session at the path and tell it to read the file first. Point,
don't paste — a summary shoved into a shell argument gets mangled by backticks
and `$(...)`, and the usual result is silent truncation rather than an error, so
the next agent starts from a quietly incomplete brief.

**Where did the file go, and will it still be there tomorrow?**

Ask for the path and keep it; temp directory paths are long and differ per OS.
Treat the file as perishable — `/private/tmp` empties on reboot and some
harnesses clear temp between sessions. If the next session is not starting
shortly, copy it somewhere durable yourself, along with anything it points at
that also lives in temp.

**Can I use it without ending my session?**

That is its best use. You stay in the conversation you have built, hand a copy
of the accumulated context to a second agent, and let it go answer a side
question — settling a design question with
[prototype](../engineering/prototype.md) is the common one. The answer comes
back as a fact you reference; the thread you were on never gets spent.

**It records what, not why.**

Partly true, and there are two fixes. Pass the argument, so the reasoning
bearing on the next task is what survives compression. Then read the document
before you hand it over and downgrade anything the session assumed but never
verified — "the migration is done", "that endpoint doesn't exist". The next
agent reads the handoff as a contract and will not re-check it, so a belief
written as a fact becomes a false premise for everything downstream.

**Should this live in `CLAUDE.md` instead?**

Ask whether it is still true next month. `CLAUDE.md` is standing project context
loaded into every session; a handoff is about one piece of work and is dead the
moment that work lands. A fact you keep re-explaining across unrelated sessions
is a `CLAUDE.md` problem wearing a handoff costume.

## It's working if

- The file is a small fraction of the conversation, and the specs, issues and
  diffs in it appear as paths and URLs rather than as copied text.
- You can read it cold, with the original session closed, and know the next
  move.
- The fresh agent starts working instead of asking you to re-explain the setup.
- The suggested-skills section names the skill you would have reached for
  yourself.
- In the parallel case, your original session is untouched when you return to
  it.
- Nothing in the file is a credential.
