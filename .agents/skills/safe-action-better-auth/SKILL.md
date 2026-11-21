---
name: safe-action-better-auth
description: Use when adding authentication or authorization to safe actions with Better Auth -- covers betterAuth() middleware setup, typed session context (BetterAuthContext), custom authorize callbacks (AuthorizeFn), unauthorized() handling, nextCookies() configuration, and Next.js authInterrupts setup
---

# next-safe-action Better Auth Adapter

## Install

```bash
npm install @next-safe-action/adapter-better-auth better-auth
```

## Import

```ts
import { betterAuth } from "@next-safe-action/adapter-better-auth";
```

## Quick Start

### 1. Set up Better Auth

Create your Better Auth server instance. Add the `nextCookies()` plugin if your actions need to set cookies (e.g. `signInEmail`, `signUpEmail`):

```ts
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  // ...your config (database, plugins, etc.)
  plugins: [
    // ...other plugins
    nextCookies(), // must be the last plugin in the array
  ],
});
```

### 2. Enable auth interrupts in Next.js

The default behavior uses `unauthorized()` from `next/navigation`, which requires this flag:

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};

export default nextConfig;
```

### 3. Create an authenticated action client

```ts
// src/lib/safe-action.ts
import { createSafeActionClient } from "next-safe-action";
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

// Public action client (no auth required)
export const actionClient = createSafeActionClient();

// Authenticated action client
export const authClient = actionClient.use(betterAuth(auth));
```

### 4. Use it in your actions

```ts
// src/app/actions.ts
"use server";

import { z } from "zod";
import { authClient } from "@/lib/safe-action";

export const updateProfile = authClient
  .inputSchema(z.object({ name: z.string().min(1) }))
  .action(async ({ parsedInput, ctx }) => {
    // ctx.auth.user and ctx.auth.session are fully typed,
    // including fields from Better Auth plugins
    const userId = ctx.auth.user.id;

    await db.user.update({
      where: { id: userId },
      data: { name: parsedInput.name },
    });

    return { success: true };
  });
```

## How It Works

`betterAuth()` creates a pre-validation middleware for the safe action client's `.use()` chain:

1. **Fetches the session** by calling `auth.api.getSession({ headers: await headers() })` using the request headers from `next/headers`
2. **Blocks unauthenticated requests** by calling `unauthorized()` from `next/navigation` when no session exists
3. **Injects typed context** by passing `{ auth: { user, session } }` to `next()`, merging it into the action context

The context is namespaced under `auth` to avoid collisions with other middleware context properties.

## Type Inference

The middleware infers the exact `user` and `session` types from your Better Auth instance, including any fields added by plugins. For example, if you use the `organization` plugin, `ctx.auth.session` will include `activeOrganizationId`. No manual type annotations are needed.

## Entry Points

| Entry point                             | Exports             | Environment |
| --------------------------------------- | ------------------- | ----------- |
| `@next-safe-action/adapter-better-auth` | `betterAuth`, types | Server      |

## Exported Types

| Type                         | Description                                                                                                                                                    |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BetterAuthContext<O>`       | The context shape added by the middleware: `{ auth: { user, session } }`. Types are inferred from the Better Auth instance via `Auth<O>["$Infer"]["Session"]`. |
| `AuthorizeFn<O, NC, Ctx>`    | The `authorize` callback signature. Receives `{ authData, ctx, next }`.                                                                                        |
| `BetterAuthOpts<O, NC, Ctx>` | The options object type for `betterAuth()`. Contains the optional `authorize` callback.                                                                        |

## vs. Manual Auth Middleware

If you are using Better Auth, prefer `betterAuth(auth)` over writing manual auth middleware. The adapter handles session fetching, cookie integration, typing, and unauthorized rejection automatically.

```ts
// Manual — don't do this if you have @next-safe-action/adapter-better-auth installed
const authClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    throw new Error("Unauthorized");
  }
  return next({ ctx: { userId: session.user.id } });
});

// With adapter — do this instead
const authClient = actionClient.use(betterAuth(auth));
// ctx.auth.user and ctx.auth.session are fully typed automatically
```

## Supporting Docs

- [Custom authorize patterns (role checks, redirects, org access)](./authorize-patterns.md)

## Anti-Patterns

```ts
// BAD: Missing nextCookies() plugin — cookies won't be set in Server Actions
// Session will silently be null when actions try to set cookies
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  plugins: [/* no nextCookies() */],
});

// GOOD: Add nextCookies() as the last plugin
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

export const auth = betterAuth({
  plugins: [
    // ...other plugins
    nextCookies(), // must be last
  ],
});
```

```ts
// BAD: Missing authInterrupts flag — unauthorized() will throw a runtime error
// next.config.ts
const nextConfig: NextConfig = {};

// GOOD: Enable authInterrupts
const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
  },
};
```

```ts
// BAD: Re-fetching session inside authorize — it's already pre-fetched as authData
actionClient.use(
  betterAuth(auth, {
    authorize: async ({ next }) => {
      const session = await auth.api.getSession({ headers: await headers() }); // Redundant!
      if (!session || session.user.role !== "admin") {
        unauthorized();
      }
      return next({ ctx: { auth: session } });
    },
  }),
);

// GOOD: Use the pre-fetched authData directly
actionClient.use(
  betterAuth(auth, {
    authorize: ({ authData, next }) => {
      if (!authData || authData.user.role !== "admin") {
        unauthorized();
      }
      return next({ ctx: { auth: authData } });
    },
  }),
);
```

```ts
// BAD: Writing manual Better Auth middleware when the adapter is installed
import { auth } from "./auth";

const authClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return next({ ctx: { user: session.user } });
});

// GOOD: Use the adapter — handles typing, cookies, and unauthorized() automatically
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

const authClient = actionClient.use(betterAuth(auth));
```
