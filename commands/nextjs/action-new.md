---
description: Scaffold a Next.js 15 Server Action with Zod validation and typed results
argument-hint: "<actionName> [what it does]"
allowed-tools: Read, Write, Edit, Glob, Grep
model: claude-opus-4-8
---

Generate a Next.js 15 Server Action with `'use server'`, Zod input validation, an auth
check, and a discriminated result type.

## Request

$ARGUMENTS

## Standards

- `'use server'` at the top of the module (or inline in the function).
- Validate every input with Zod before touching data — never trust the client.
- Return the project result shape: `{ data, success: true }` or
  `{ error, success: false }`. Never throw across the server/client boundary for
  expected failures.
- Re-check auth inside the action. A Server Action is a public HTTP endpoint; do not rely
  on the calling component having gated it.
- `revalidatePath` / `revalidateTag` after a successful mutation.

## What to Generate

### 1. The action — `app/<feature>/actions.ts`

```typescript
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const inputSchema = z.object({
  title: z.string().min(1).max(200),
})

type ActionResult<T> =
  | { data: T; success: true }
  | { error: string; success: false }

export async function createItem(
  input: z.input<typeof inputSchema>
): Promise<ActionResult<{ id: string }>> {
  const parsed = inputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid input', success: false }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', success: false }

  const { data, error } = await supabase
    .from('items')
    .insert({ title: parsed.data.title, user_id: user.id })
    .select('id')
    .single()

  if (error) return { error: error.message, success: false }

  revalidatePath('/<feature>')
  return { data: { id: data.id }, success: true }
}
```

### 2. The client usage — `useActionState` (React 19 / Next 15)

```typescript
'use client'

import { useActionState } from 'react'
import { createItem } from './actions'

export function ItemForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: unknown, formData: FormData) =>
      createItem({ title: String(formData.get('title') ?? '') }),
    null
  )

  return (
    <form action={formAction}>
      <input name="title" required />
      <button disabled={pending}>{pending ? 'Saving…' : 'Save'}</button>
      {state && !state.success && <p role="alert">{state.error}</p>}
    </form>
  )
}
```

### 3. Tests — `app/<feature>/actions.test.ts`

Cover: valid input succeeds, invalid input returns a validation error, unauthenticated
calls are rejected, and a database error is surfaced as `{ success: false }`. Mock the
Supabase client.

## Output

- `actions.ts` with the validated, auth-checked action.
- A client component wiring it through `useActionState`.
- A Vitest test file.
- Notes on which `revalidatePath`/`revalidateTag` calls fire and why.

## Safety

- Treat Server Actions as untrusted public endpoints: validate input and re-check auth
  every time.
- Never return raw database errors that leak schema details to anonymous callers — map
  them to safe messages.
