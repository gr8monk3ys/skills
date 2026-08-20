# frontend-development

## What it does

`frontend-development` is the standard the agent applies when it builds UI —
React 19 and the Next.js App Router, styled with Tailwind, with state placed
according to what kind of state it is.

Its governing default is that a component is a Server Component until something
forces otherwise. `'use client'` is a cost to be justified, not the starting
point, and the skill's second default follows from the first: accessible markup
is what gets written the first time, because semantic HTML and keyboard
behaviour are far cheaper to write than to retrofit.

## When to reach for it

It activates on its own. A `UserPromptSubmit` hook scores each prompt against
`hooks/skill-rules.json` and loads the skill when the score clears its
threshold — a `page.tsx` path, a `className=`, the word component, or an intent
like "make this responsive" is enough. You never invoke it for a normal UI
task.

Type `/frontend-development` when you want it for something the hook won't
catch, such as an accessibility pass over components you aren't describing in
UI vocabulary.

## What it makes the agent good at

| Concern | The default it applies |
| --- | --- |
| Component boundary | Server Component by default; `'use client'` only where interactivity or browser APIs demand it |
| Props | An explicit interface, always typed |
| Styling | Tailwind utilities, mobile-first, dark mode via CSS variables |
| Server state | TanStack Query — not `useEffect` and a `useState` |
| Client state | Zustand globally, Context per feature, `nuqs` when the state belongs in the URL |
| Forms | React Hook Form, validated |
| Accessibility | WCAG 2.1 AA: semantic elements, ARIA only where semantics run out, keyboard paths, managed focus |

The state table is the part that saves the most rework. Most tangled React
components are one kind of state stored in the wrong place — server data held in
component state, or filter state held in memory when it should have been in the
URL and shareable. Deciding that per piece of state, up front, is most of what
this skill buys.

Base components come from shadcn/ui, with Radix underneath for headless
primitives, organised by feature rather than by file type.

## Commands it pairs with

- [`/component-new`](../../commands/component-new.md) — a typed component;
  this skill decides whether it's a Server or Client one.
- [`/page-new`](../../commands/page-new.md) — App Router pages with layouts,
  loading and error states, metadata.
- [`/hook-new`](../../commands/hook-new.md) — custom hooks, which by definition
  land on the client side of the boundary.
- [`/test-new`](../../commands/test-new.md) — component tests.

When you want to see options rather than build one design, that's
[prototype](./prototype.md), which puts three structurally different variants
on the route and lets you flip between them. Data fetched by these components
comes from [api-development](./api-development.md).

## Common questions

**I didn't invoke it — why is it active?**

Because your prompt scored above the activation threshold in the prompt hook.
That's the design: the standards apply to every component, including the ones
written in the middle of some other task.

**We're on Vue, or Svelte, or plain React with Vite. Is it useful?**

The framework-neutral parts are — the accessibility bar, mobile-first styling,
and the question of where each kind of state belongs. Everything naming Next.js,
Server Components, or the specific libraries assumes this plugin's stack. Expect
to argue with it if your stack differs.

**Does "Server First" mean it avoids interactivity?**

No. It means the client boundary is drawn deliberately and as low in the tree as
possible, so an interactive leaf doesn't drag its parents to the client with it.
Interactive components are still client components.

**Do I have to use shadcn/ui and Zustand?**

They're the defaults, not a requirement. If your project already has a component
library or a store, say so once and the existing choice wins — the skill's value
is in consistency, and switching libraries mid-project is the opposite of that.

## It's working if

- New components are Server Components unless something in them genuinely needs
  the client.
- `'use client'` appears at leaves, not at the top of a page.
- Every component has a typed props interface, and no `any` among them.
- Server data goes through TanStack Query rather than a hand-rolled effect.
- You can operate the feature from the keyboard, and the markup uses real
  elements rather than divs with click handlers.
- Layouts hold up at phone width without a later responsive pass.
