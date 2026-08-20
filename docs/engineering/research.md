# research

## What it does

`research` investigates a question against primary sources — official docs,
source code, specs, first-party APIs — and captures what it found as a
Markdown file in the repo, with each claim cited to the source that owns it.

It runs as a background agent and hands back a file, not a chat reply. That is
the whole shape of the skill: you keep working while it reads, and the result
is a document you can review, correct, commit, and point other people at, rather
than an answer that scrolls out of the session it was asked in.

## When to reach for it

Type `/research`, or the agent reaches for it automatically when a task fits —
"look into", "find out whether", "compare these two libraries".

Reach for it when the reading is the work: a question you'd otherwise spend an
hour on with fifteen tabs open, and whose answer other people on the project
will also need. For a question you can settle by building something small
instead of reading, use [prototype](./prototype.md).

Don't reach for it for a fact you already half-know and just want confirmed —
the overhead of a background agent and a file is not worth one lookup.

## Primary sources, not write-ups

The instruction the agent is held to is to follow every claim back to the source
that owns it. A blog post explaining an API is not the API's documentation; a
Stack Overflow answer about a library's behaviour is not that library's source.
Both are fine as a way to find the primary source, and neither is allowed to be
the citation.

This is what makes the output worth keeping. A cited claim can be re-checked
when the library changes; an uncited summary has to be redone from scratch.

## The file it leaves behind

It writes one Markdown file, and it matches whatever convention the repo
already uses for notes — if there's a `docs/research/`, that's where it lands.
When the repo has no convention, it picks somewhere sensible and tells you
where, rather than inventing a directory silently.

Treat the file as a draft with citations rather than a verdict. The citations
are there so you can check the two or three claims the decision actually turns
on.

## Common questions

**Can I keep working while it runs?**

Yes — that is why it's a background agent. You get the file when it's done. A
long research task and your own work do not compete for the same session.

**Where does the file go?**

Wherever the repo already keeps notes. If nothing like that exists, it chooses
a location and says so in its report, so you can move it once and set the
convention for next time.

**Is it going to be right?**

It's going to be sourced, which is a different and more checkable property.
The value is that every claim names where it came from, so verifying the
conclusion means opening two or three links rather than repeating the whole
investigation.

**Should the file be committed?**

Usually yes, once you've read it. The reason to write research into the repo at
all is that the next person asking the same question finds the answer instead of
re-running the search.

## It's working if

- Your session stays usable while the research happens.
- The result is a file in the repo, and the agent tells you its path.
- Claims carry citations, and those citations point at docs, specs, or source —
  not at articles about them.
- The file lands where the repo's other notes live, or the agent says why it
  chose somewhere else.
- Checking the conclusion means following a link, not redoing the work.
