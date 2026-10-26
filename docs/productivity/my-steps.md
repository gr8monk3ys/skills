# my-steps

## What it does

`my-steps` splits what is left into two columns — what the agent can do with its
tools, and what only you can do — does its column first, and hands you exact,
numbered steps for yours: the deep link, the click path, the full command in a
labelled block, what success looks like, and what to paste back.

It pushes as much as possible into its own column. Your column is limited to
what truly needs a human: passwords, 2FA, payments, accepting terms, physical
actions.

## When to reach for it

You invoke this by typing `/my-steps` — the agent won't reach for it on its own.
Run it again with your progress: `/my-steps did 1-3, step 4 failed with <error>`,
or tell it you are away from the machine with `/my-steps I'm remote`.

Reach for it for any setup that mixes your accounts with the agent's work. For
long one-off procedures you want as a re-runnable script, use
[wizard](../engineering/wizard.md).

## Common questions

**Why full paths in every command?**

Admin PowerShell opens in `C:\WINDOWS\system32`, so relative paths land in the
wrong place. The skill also checks commands for PowerShell interpolation traps
before sending them.

**What does it do with my "did 1-3"?**

It checks each claim where it can, and treats any pasted error as the next
thing to diagnose.

## It's working if

- Your list contains only things the tools truly cannot do.
- Every step has a link or a command you can copy without edits.
