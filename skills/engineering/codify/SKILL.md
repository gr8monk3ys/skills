---
name: codify
description: Turn a correction into a deterministic check — lint rule, type constraint, test, dependency boundary, or CI validator — so the mistake cannot recur, instead of another line of prose in CLAUDE.md. Use when the user corrects how you did something in a way that could happen again ("don't use X here", "always go through Y", "we never do Z"), or asks to enforce, ban, or guard against a pattern.
argument-hint: "The correction, in your words — e.g. 'never call requests directly, use the shared client'"
---

# codify

A correction written as prose is a request the next agent may not read. A correction written as a check is a build that goes **red**. Every time you are corrected, make the repo enforce it: the agent that repeats the mistake hits an error message that tells it the fix, without anyone having to remember.

The correction is the argument to `/codify`, or the one the user just gave you. A one-off preference ("call this variable `total`") has nothing to recur — apply it and stop. Everything else runs the loop below.

## 1. Restate the rule

Write the correction as one falsifiable sentence of the form **"X must never happen in Y"** (or "X happens only through Y"): `requests` is imported only in `app/http/client.py`; `useEffect` appears only under `src/hooks/effects/`. A sentence a machine cannot check is not finished — narrow it until it is.

Then look for an existing check that already encodes it and was bypassed (a disabled rule, an `eslint-disable`, a `# noqa`, a skipped test). If one exists, the fix is to close the bypass, not to add a second check.

**Done when:** the rule is one sentence with a concrete forbidden pattern and a concrete place it is allowed (or nowhere).

## 2. Pick the strongest mechanism this repo supports

Read the repo's own tooling first — `package.json` scripts, `pyproject.toml`, `Makefile`, the CI workflow, existing validator scripts and their tests. Then take the first rung that can express the rule:

1. **Make it impossible.** Change the API, architecture, or directory boundary so the wrong thing cannot be written: unexport the internal, make the constructor private, move the raw client behind a module that is the only importer.
2. **Linter rule** — the linter the repo already runs before adding one: ruff, eslint, biome, oxlint, shellcheck, clippy. Built-in rules first (`no-restricted-imports`, `no-restricted-syntax`, ruff `banned-api`/`TID251`, clippy `disallowed_methods`); dependency-boundary rules next (`eslint-plugin-boundaries`, `import/no-restricted-paths`, ruff `banned-module-level-imports`); a custom rule or a small repo-local validator script only when nothing built in fits.
3. **Type constraint** — branded types, `never`-typed branches, a narrowed signature that rejects the wrong input at compile time.
4. **Test** — property-based (fast-check, Hypothesis, proptest) when the rule is general over inputs; example-based when it is about one behaviour.
5. **CI validator** — a script the CI workflow runs, for rules about the repo itself (file layout, docs coverage, manifest consistency).

Every check's error message names the root-cause fix, not just the violation: "`requests` is banned here — use `app.http.client.get()`; it carries retries, timeouts and auth. Add a method there if it lacks one." The reader of that message is the next agent; it should be able to fix the code from the message alone.

**Done when:** the check is wired into the command the repo already runs (lint, test, or CI), and its message states the fix.

## 3. Prove it goes red

Add a failing example the check must catch — a fixture file, a `RuleTester` case, a BATS test against a fixture root, a test that lints a code string. Run it and capture the failure. Then run the repo's full verify/CI command and capture it passing.

A check you never saw fail is a check you do not know works. If the fixture does not go red, the check is wrong; fix it before going on.

**Done when:** you have the red output for the fixture and the green output for the whole suite, both verbatim.

## 4. Sweep existing violations

Run the new check across the whole repo. Fix every violation when the count is small enough to review in one diff.

When it is not, **ratchet**: record today's violations in a tracked allowlist (a file listing each path, or the linter's own per-file ignores), and add a test that fails when

- a violation appears that is not on the list, and
- an entry on the list no longer violates (so fixed entries must be deleted), and
- the list is longer than a hard-coded ceiling equal to today's count — growing it means editing the ceiling in the same diff, where a reviewer sees it.

The allowlist only shrinks. Say how many entries it starts with.

**Done when:** the check passes on the whole repo, with zero violations or a ratcheted allowlist.

## 5. Prose is the last resort

Only when no rung in step 2 can express the rule — it depends on intent, taste, or context no tool can see — add **one line** to the repo's `CLAUDE.md` or `AGENTS.md` (whichever it already uses), in the form `- <rule> (not codified: <why no check can express it>)`. Tell the user what made it uncodifiable; a reason like "needs a custom AST rule we have no linter for" is an invitation to build one later.

## 6. Commit and report

Commit the check, its proof, and the sweep as their own conventional commit — separate from any feature work in progress (stage only these files). Pick the type by what dominates: `build(lint):` for linter config, `test:` for a test-only rule, `ci:` for a validator, `refactor:` when sweep fixes dominate.

Report, in this order:

- **Rule** — the sentence from step 1.
- **Mechanism** — which rung, and why the stronger rungs did not fit.
- **Files** — every file added or changed.
- **Proof** — the red output from step 3, then the green.
- **Sweep** — violations fixed, or the allowlist and its starting size.

## Worked examples

**TS/React — "stop reaching for `useEffect`."** Rule: `useEffect` is imported only under `src/hooks/effects/`. Rung 2, ESLint flat config: `no-restricted-imports` with `paths: [{ name: 'react', importNames: ['useEffect'], message: 'useEffect is allowed only in src/hooks/effects/. Derive the value during render, move it to the event handler, or wrap the effect in a hook there. See react.dev/learn/you-might-not-need-an-effect' }]`, plus `no-restricted-syntax` on `MemberExpression[object.name='React'][property.name='useEffect']` to close the `React.useEffect` bypass, and an override turning both off for `src/hooks/effects/**`. Proof: a Vitest case calling `new ESLint().lintText(code, { filePath: 'src/components/Bad.tsx' })` and asserting one error with that message. Sweep: 40 call sites → ratchet in `eslint.config.js` `ignores` for those files, with a test pinning the count.

**Python — "use the shared client, not `requests`."** Rule: `requests` is imported only in `app/http/client.py`. Rung 2, ruff in `pyproject.toml`: `extend-select = ["TID251"]`, `[tool.ruff.lint.flake8-tidy-imports.banned-api] "requests".msg = "Use app.http.client — it carries retries, timeouts and auth. Add a method there if it lacks one."`, and `per-file-ignores` exempting `app/http/client.py`. Proof: a pytest case piping `import requests` to `ruff check --stdin-filename app/x.py -` and asserting `TID251` and the message. Sweep: three call sites → fix them now.

**Shell/dotfiles — "read manifests through `bin/manifest`."** Rule: files under `install/` are read only by `bin/manifest`. No linter can see this, so rung 5: a validator `bin/check-manifest-readers` that greps `bin/`, `lib/` and `.config/` for `install/(Brewfile|Caskfile|…)`, skips `bin/manifest` itself, and fails with "read install/<file> via `bin/manifest list <kind>` — it handles taps, comments and platform filters." Model it on `bin/check-alias-references` (allowlist file under `test/allowlist/`) and `bin/validate-tool-docs` (takes a root argument so tests can point it at fixtures). Proof: a BATS test with a fixture root holding one script that `cat`s `install/Brewfile` — assert status 1 and the path in the output — and a clean root asserting status 0. Wire it into the target CI already runs.
