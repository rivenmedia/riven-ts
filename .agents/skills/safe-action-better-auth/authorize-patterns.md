# Custom Authorize Patterns

The `authorize` callback lets you customize the authorization flow. The session is pre-fetched and passed as `authData`, so common customizations don't need to re-fetch.

## authorize Callback Parameters

| Parameter  | Type                                                                          | Description                                                                                                 |
| ---------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `authData` | `{ user, session } \| null`                                                   | Pre-fetched session data, or `null` if no valid session exists. Fully typed from your Better Auth instance. |
| `ctx`      | `object`                                                                      | Accumulated context from middleware that ran before `betterAuth()`.                                         |
| `next`     | `<C extends object>(opts?: { ctx?: C }) => Promise<MiddlewareResult<any, C>>` | Call to continue the middleware chain. Pass `{ ctx }` to inject context into the action.                    |

## Role-Based Access

```ts
// src/lib/safe-action.ts
import { unauthorized } from "next/navigation";
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

export const adminClient = actionClient.use(
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

Usage:

```ts
// src/app/actions.ts
"use server";

export const deleteUser = adminClient
  .inputSchema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    // Only admins reach here
    await db.user.delete({ where: { id: parsedInput.userId } });
    return { success: true };
  });
```

## Redirect Instead of 401

Use `redirect()` instead of `unauthorized()` when you want to send unauthenticated users to a login page:

```ts
import { redirect } from "next/navigation";
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

export const authClient = actionClient.use(
  betterAuth(auth, {
    authorize: ({ authData, next }) => {
      if (!authData) {
        redirect("/login");
      }
      return next({ ctx: { auth: authData } });
    },
  }),
);
```

This does not require `authInterrupts: true` in `next.config.ts` since `redirect()` is a standard Next.js navigation function.

## Organization-Scoped Access

When using Better Auth's `organization` plugin, session types automatically include `activeOrganizationId`:

```ts
import { unauthorized } from "next/navigation";
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth"; // auth configured with organization plugin

export const orgClient = actionClient.use(
  betterAuth(auth, {
    authorize: ({ authData, next }) => {
      if (!authData) {
        unauthorized();
      }

      // authData.session.activeOrganizationId is typed automatically
      // because the organization plugin adds it to the session type
      if (!authData.session.activeOrganizationId) {
        throw new Error("No active organization selected");
      }

      return next({
        ctx: {
          auth: authData,
          orgId: authData.session.activeOrganizationId,
        },
      });
    },
  }),
);
```

## Context from Prior Middleware

The `ctx` parameter in `authorize` receives context from middleware that ran before `betterAuth()`. You can use it for authorization decisions and forward it via `next()`:

```ts
// Logging middleware runs first, adds requestId to context
const loggedClient = actionClient.use(async ({ next }) => {
  return next({ ctx: { requestId: crypto.randomUUID() } });
});

// betterAuth runs second — authorize receives { requestId } in ctx
const authClient = loggedClient.use(
  betterAuth(auth, {
    authorize: ({ authData, ctx, next }) => {
      // ctx.requestId is available from the prior middleware
      console.log(`Auth check for request ${ctx.requestId}`);

      if (!authData) {
        unauthorized();
      }

      return next({ ctx: { auth: authData } });
    },
  }),
);
```

## Allowing Unauthenticated Access

For actions where authentication is optional (e.g., showing different content for logged-in vs anonymous users):

```ts
import { betterAuth } from "@next-safe-action/adapter-better-auth";
import { auth } from "./auth";

// Does NOT call unauthorized() — allows null authData through
export const optionalAuthClient = actionClient.use(
  betterAuth(auth, {
    authorize: ({ authData, next }) => {
      return next({
        ctx: { auth: authData }, // null if not logged in
      });
    },
  }),
);
```

Usage:

```ts
"use server";

export const getContent = optionalAuthClient.action(async ({ ctx }) => {
  if (ctx.auth) {
    // Logged in — show personalized content
    return { greeting: `Hello, ${ctx.auth.user.name}` };
  }
  // Anonymous — show public content
  return { greeting: "Hello, visitor" };
});
```
