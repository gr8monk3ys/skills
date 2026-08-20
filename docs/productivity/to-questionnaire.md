# to-questionnaire

## What it does

`to-questionnaire` turns a decision you cannot make alone into a Markdown
questionnaire you hand to the one person who can — written to
`to-questionnaire-<slug>.md` in the current directory, ready to send or to walk
through together in a meeting.

It never interviews you about the subject. It interviews you about the *send*:
who is receiving this, and what you need back from them. Those two you can
always answer, even about a topic you understand poorly, and the questions in
the document are then aimed at exactly the gap between what the recipient knows
and what you need. That inversion is why the skill works on the decisions where
you would otherwise have nothing to say.

## When to reach for it

You invoke this by typing `/to-questionnaire` — the agent won't reach for it on
its own.

Reach for it when the thing blocking a decision is knowledge that lives in
someone's head: the person who ran the last migration, the client who knows what
"launch" means, the security reviewer whose constraints you are guessing at. If
the answer is written down somewhere and just needs finding, that is
[research](../engineering/research.md). If the answer needs running code, that
is [prototype](../engineering/prototype.md). A questionnaire is for the answers
only a person can give.

## Two questions, then the document

The skill spends one exchange on each, and does not proceed on a vague answer:

1. **Who is it going to?** Their role, their expertise, and their relationship
   to you. This sets the tone and how much background the document has to carry
   — a questionnaire for your co-founder and one for a client's IT contact are
   different documents.
2. **What do you need back?** The specific decisions or facts you cannot resolve
   alone. This is the completeness check: every item you name here has to be
   covered by a question, and it is what stops the document from becoming a
   general-interest interview.

Only then does it write. The finished file opens with why it exists and what
decision rides on it, names sender and recipient, says where the answers will go,
carries a one-paragraph context section for someone who wasn't in your head, and
gives a deadline and a rough effort estimate.

## What a good question looks like

Ordered most-important-first, because async means you may only get one pass and
the last third may never be reached. One idea per question — a compound question
gets a compound answer that resolves neither half.

## Common questions

**Why does it grill me instead of just writing the questions?**

Because a questionnaire written without the recipient in view asks generically,
and generic questions get generic answers. Knowing that the recipient already
knows the deployment topology means the document doesn't spend three questions
re-establishing it, and knowing you need a go/no-go by Friday means the question
that decides it goes first.

**What if I don't really know what I need back?**

Say that, in whatever rough form you have it — "I need to know whether we can
ship without their sign-off" is enough to work with. The interview step exists to
sharpen exactly this, and a questionnaire built on a fuzzy ask produces answers
you cannot act on, which costs you the whole round trip.

**Can I use it for a live conversation rather than email?**

Yes, and the ordering carries over: a meeting that runs short has covered the
things that mattered. The answer stubs become your notes surface, and the
document is a record afterwards rather than a memory of a call.

**Several people need to answer different parts.**

Run it once per recipient. The document's tone, its context section, and how
much it explains are all pinned to one person's knowledge; splitting them keeps
each version short and answerable, and nobody is asked to skip past three
sections that are not theirs.

**What if they answer "I don't know"?**

That is a useful answer and the document says so explicitly, because the
alternative is a confident guess you cannot distinguish from a fact. A flagged
uncertainty tells you where to look next; a silent guess sends you down a path
built on it.

**Do I commit the file?**

Usually not — it lands in the current directory so you can find and send it, not
because it belongs in the repo. If the answers turn out to be a decision the
project should remember, that belongs in a `CONTEXT.md` term or an ADR via
[domain-modeling](../engineering/domain-modeling.md), not in a questionnaire
nobody will re-read.

## It's working if

- You were asked about the recipient and your needs, and never asked to explain
  the subject you're stuck on.
- Every item you said you needed back has a question pointing at it.
- The recipient can answer without a preliminary call to establish what you
  meant.
- The first three questions are the ones you'd most regret leaving unanswered.
- Answers come back in the stubs, and the uncertain ones come back flagged
  rather than guessed.
