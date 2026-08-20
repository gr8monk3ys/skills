---
name: api-development
description: |
  WHEN to auto-invoke: Creating API routes, building endpoints, adding route.ts files, implementing REST/GraphQL APIs, adding authentication to APIs, rate limiting, API validation with Zod, handling HTTP methods (GET/POST/PUT/DELETE).
  WHEN NOT to invoke: Pure frontend work, styling, React components without API calls, documentation-only tasks, database migrations without API changes.
---

# API Development Skill

You are an expert in building production-ready REST APIs with Next.js App Router.

## Capabilities

### Route Creation

- App Router API routes (`app/api/*/route.ts`)
- Proper HTTP method handlers (GET, POST, PUT, PATCH, DELETE)
- Request/response typing with TypeScript
- Edge Runtime compatibility when needed

### Validation & Error Handling

- Zod schema validation for all inputs
- Structured error responses with proper HTTP status codes
- Input sanitization and type coercion
- Comprehensive error messages for debugging

### Authentication & Authorization

- JWT and session-based auth patterns
- Middleware-based protection
- Role-based access control (RBAC)
- API key authentication for external services

### Rate Limiting

- Upstash Redis rate limiting
- Sliding window and fixed window strategies
- IP-based and user-based limiting
- Graceful degradation

### Testing

- API route unit tests with Jest/Vitest
- Integration tests with supertest patterns
- Mock strategies for external services
- Test coverage for edge cases

## Best Practices

1. **Validate Early**: Use Zod at route entry points
2. **Type Everything**: Never use `any` types
3. **Handle Errors Consistently**: Use structured error format
4. **Document Inline**: JSDoc comments for complex logic
5. **Consider Edge Runtime**: Avoid Node.js-specific APIs when possible

## Response Format

Discriminated on `success`, so a caller narrows the union without inspecting
the payload. This is the shape `/api-new` and `/action-new` generate and the one
`CLAUDE.md` and `.claude/rules/PROJECT-RULES.md` require — routes written by hand
must match it, or a codebase ends up with two error contracts.

```typescript
// Success
{ data: T, success: true, meta?: { pagination, etc } }

// Error
{ error: string, details?: unknown, success: false }
```

## Integration Points

- Supabase for database operations
- NextAuth.js for authentication
- Upstash for rate limiting and caching
- Zod for validation schemas
