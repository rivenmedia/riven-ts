---
title: Return `{ data }` and `{ errors }` Directly in GraphQL Handlers
impact: MEDIUM
description: GraphQL handlers return `HttpResponse.json({ data: ... })` — the v1 `ctx.data()` and `ctx.errors()` helpers are removed.
tags: graphql, response, data, errors, v2, migration
---

# Return `{ data }` and `{ errors }` Directly

## Problem

v1 used `res(ctx.data({ user: ... }))` for GraphQL responses. From v2 on, you return the standard GraphQL response shape via `HttpResponse.json()`. In v3, operations are defined on a `graphql.link()`, not on the `graphql` namespace.

## Incorrect

```typescript
// BUG: ctx.data() is removed in v2
import { graphql } from "msw/graphql";

// @ts-expect-error v1 resolver signature (req, res, ctx), and msw 3 has no graphql.query()
graphql.query("GetUser", (req, res, ctx) => {
  return res(ctx.data({ user: { id: "1", name: "John" } }));
});
```

## Correct

```typescript
import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";

const api = graphql.link("/graphql");

// Success response
api.query("GetUser", ({ variables }) => {
  return HttpResponse.json({
    data: {
      user: { id: variables.id, name: "John" },
    },
  });
});

// Error response
api.query("GetUser", () => {
  return HttpResponse.json({
    errors: [{ message: "User not found" }],
  });
});

// Partial data with errors
api.query("GetUser", () => {
  return HttpResponse.json({
    data: { user: null },
    errors: [{ message: "Unauthorized field access" }],
  });
});
```

## Why

v2 removes the GraphQL-specific context utilities. You construct the standard GraphQL response shape (`{ data, errors, extensions }`) directly. This is more explicit and consistent with how GraphQL servers actually respond.
