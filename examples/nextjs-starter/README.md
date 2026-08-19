# Next.js Starter with Lorenzo's Claude Code

This example project demonstrates how to use **lorenzos-claude-code** plugin to accelerate your Next.js development workflow.

## Quick Start

```bash
# 1. Create a new Next.js project
npx create-next-app@latest my-app --typescript --tailwind --eslint --app --src-dir

# 2. Navigate to the project
cd my-app

# 3. Install the plugin in Claude Code
/plugin install gr8monk3ys/lorenzos-claude-code

# 4. Start building with slash commands!
```

## Example Workflows

### Building a User Authentication Feature

```bash
# 1. Plan the feature
/feature-plan Add user authentication with email/password and OAuth providers

# 2. Create the API endpoint
/api-new Create POST /api/auth/register for user registration with email validation

# 3. Add protection
/api-protect Add rate limiting and input validation to /api/auth/register

# 4. Generate tests
/test-new src/app/api/auth/register/route.ts

# 5. Create the UI
/page-new Create /auth/login page with form for email/password login

# 6. Create a reusable hook
/hook-new Create useAuth hook for managing authentication state
```

### Building a Product Catalog

```bash
# 1. Design the database schema (use database-architect agent)
"Help me design a schema for an e-commerce product catalog with categories and variants"

# 2. Create the migration
/migration-new Create products table with name, price, description, category_id, and variants JSONB

# 3. Generate Supabase types
/types-gen

# 4. Create API endpoints
/api-new Create GET /api/products with pagination, filtering by category, and search

# 5. Create the product listing component
/component-new Create ProductCard component with image, title, price, and add-to-cart button

# 6. Create the products page
/page-new Create /products page with grid layout and filters sidebar
```

### Adding Real-time Features

```bash
# 1. Research the approach (use tech-stack-researcher agent)
"Should I use WebSockets, SSE, or Supabase Realtime for live notifications?"

# 2. Create edge function for real-time
/edge-function-new Create notification-handler edge function for processing and broadcasting notifications

# 3. Create the notification component
/component-new Create NotificationBell component with unread count badge and dropdown

# 4. Create custom hook
/hook-new Create useNotifications hook with Supabase realtime subscription
```

### Deploying to Production

```bash
# 1. Generate deployment config
/deploy Setup Vercel deployment with GitHub Actions CI/CD

# 2. Review and optimize (use performance-engineer agent)
"Analyze my Next.js app for performance bottlenecks before deployment"

# 3. Security review (use security-engineer agent)
"Review my API routes for security vulnerabilities"
```

## Recommended Project Structure

After using the plugin commands, your project should look like:

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── register/route.ts    # Created with /api-new
│   │   │   └── login/route.ts
│   │   └── products/
│   │       └── route.ts
│   ├── auth/
│   │   ├── login/page.tsx           # Created with /page-new
│   │   └── register/page.tsx
│   ├── products/
│   │   └── page.tsx
│   └── layout.tsx
├── components/
│   ├── ProductCard.tsx              # Created with /component-new
│   └── NotificationBell.tsx
├── hooks/
│   ├── useAuth.ts                   # Created with /hook-new
│   └── useNotifications.ts
├── lib/
│   └── supabase/
│       ├── client.ts
│       └── types.ts                 # Created with /types-gen
└── __tests__/
    └── api/
        └── auth/
            └── register.test.ts     # Created with /test-new
```

## Using the AI Agents

The plugin includes specialized agents that activate based on context:

| When you ask about... | Agent that helps |
|-----------------------|------------------|
| "Which library should I use for..." | tech-stack-researcher |
| "Design a system for..." | system-architect |
| "How should I structure my database..." | database-architect |
| "Design an API for..." | api-architect |
| "Set up CI/CD for..." | devops-engineer |
| "Optimize performance of..." | performance-engineer |
| "Review security of..." | security-engineer |
| "Refactor this code..." | refactoring-expert |
| "Explain how this works..." | learning-guide |

## Tips for Best Results

1. **Be specific with commands**: `/api-new Create POST /api/users for creating new users with email, name, and role fields` works better than `/api-new users endpoint`

2. **Chain commands logically**: Create API → Add protection → Generate tests → Create UI

3. **Use agents for planning**: Ask the tech-stack-researcher or system-architect before implementing complex features

4. **Review generated code**: The plugin generates production-ready code, but always review for your specific requirements

5. **Customize templates**: Edit files in `.claude/commands/` to match your team's coding standards

## MCP Servers Available

This plugin includes 6 MCP servers:

- **Context7** - Get current library documentation
- **Playwright** - Browser automation and E2E testing
- **Supabase** - Database operations (requires config)
- **Stripe** - Payment processing (requires API key)
- **Chrome DevTools** - Browser debugging
- **Vercel** - Deployment management

## Need Help?

- Check the [main README](../../README.md) for command reference
- See [MCP-SERVERS.md](../../.claude-plugin/MCP-SERVERS.md) for server configuration
- Report issues at <https://github.com/gr8monk3ys/skills/issues>
