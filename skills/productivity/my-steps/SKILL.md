---
name: my-steps
description: Split what is left into what you can do now and what only I can do — do your part, and give me exact numbered steps with links and full commands for mine.
argument-hint: "What I already did, e.g. 'did 1-3, step 4 failed with <error>'; or 'I'm remote'"
disable-model-invocation: true
---

# my-steps

Do as much as the tools allow. Hand the user only what truly needs a human, written so they can follow it without thinking.

## 1. Take in progress

If the argument reports steps done ("did 1 and 3") or pastes output, check each claim where you can: the resource exists, the service answers, the setting changed. A pasted error becomes the new problem. Diagnose it from the output.

## 2. Sort the remaining work

- **Claude**: anything the tools can reach — code, CLI, browser tabs that are already signed in, MCP servers, computer use. Push as much as you can into this column; the user's default reply is "can't you do that for me?"
- **You**: passwords, 2FA codes, payments, accepting terms, identity checks, physical actions, and admin elevation when no tool provides it.

If the argument says the user is remote, put nothing in their column that needs this machine's screen or `localhost`.

## 3. Do the Claude column

Do every Claude step that does not wait on a user step, before you write the list.

## 4. Write the user's steps

Each step is one action:

1. **Where** — the exact URL, deep-linked to the right page, or the app and the click path.
2. **Do** — what to click or type. Commands go in a fenced block that names the shell, use full absolute paths, and say if they need an elevated prompt. Admin PowerShell starts in `C:\WINDOWS\system32`, so never rely on the working directory.
3. **Success looks like** — what they should see.
4. **Paste back** — what to send you, if anything.

Check each command for PowerShell traps before sending it. `"$env:USERNAME:(OI)"` breaks; write `"${env:USERNAME}:(OI)"`.

## 5. Close

End with: "Reply with what you did (e.g. 'did 1–3') and run `/my-steps` again."
