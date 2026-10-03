---
title: Return `{ data }` and `{ errors }` Directly in GraphQL Handlers
impact: MEDIUM
description: v2 GraphQL handlers return `HttpResponse.json({ data: ... })` — the v1 `ctx.data()` and `ctx.errors()` helpers are removed.
tags: graphql, response, data, errors, v2, migration
---

# Return `{ data }` and `{ errors }` Directly

## Problem

v1 used `res(ctx.data({ user: ... }))` for GraphQL responses. In v2, you return the standard GraphQL response shape via `HttpResponse.json()`.

## Incorrect

```typescript
// BUG: ctx.data() is removed in v2
import { graphql } from "msw";

graphql.query("GetUser", (req, res, ctx) => {
  return res(ctx.data({ user: { id: "1", name: "John" } }));
});
```

## Correct

```typescript
import { graphql, HttpResponse } from "msw";

// Success response
graphql.query("GetUser", ({ variables }) => {
  return HttpResponse.json({
    data: {
      user: { id: "1", name: "John" },
    },
  });
});

// Error response
graphql.query("GetUser", () => {
  return HttpResponse.json({
    errors: [{ message: "User not found" }],
  });
});

// Partial data with errors
graphql.query("GetUser", () => {
  return HttpResponse.json({
    data: { user: null },
    errors: [{ message: "Unauthorized field access" }],
  });
});
```

## Why

v2 removes the GraphQL-specific context utilities. You construct the standard GraphQL response shape (`{ data, errors, extensions }`) directly. This is more explicit and consistent with how GraphQL servers actually respond.
