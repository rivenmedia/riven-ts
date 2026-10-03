---
title: Use `http` Namespace Instead of `rest`
impact: CRITICAL
description: MSW v2 replaced `rest` with `http`. The `rest` namespace is removed entirely.
tags: handler, namespace, http, rest, v2, migration
---

# Use `http` Namespace Instead of `rest`

## Problem

AI agents and developers often generate `rest.get()`, `rest.post()` patterns from v1. In v2 the `rest` namespace does not exist — it has been replaced by `http`.

## Incorrect

```typescript
// BUG: 'rest' is not exported from 'msw' in v2
import { rest } from "msw";

const handlers = [
  rest.get("/api/user", (req, res, ctx) => {
    return res(ctx.json({ name: "John" }));
  }),
];
```

## Correct

```typescript
import { http, HttpResponse } from "msw";

const handlers = [
  http.get("/api/user", () => {
    return HttpResponse.json({ name: "John" });
  }),
];
```

## Why

The `rest` namespace was removed in MSW 2.0. All HTTP request handlers now use the `http` namespace. Using `rest` will produce an import error at build time.
