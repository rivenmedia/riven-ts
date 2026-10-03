---
title: Use v2 Destructured Resolver Signature
impact: CRITICAL
description: v2 resolvers receive a single object `{ request, params, cookies }` — not the v1 `(req, res, ctx)` triple.
tags: handler, resolver, signature, v2, migration, destructuring
---

# Use v2 Destructured Resolver Signature

## Problem

v1 used `(req, res, ctx) => res(ctx.json(...))`. v2 uses a single info object with `request`, `params`, `cookies`. Using the v1 signature causes runtime errors.

## Incorrect

```typescript
// BUG: v1 resolver signature — does not work in v2
http.get("/api/user/:id", (req, res, ctx) => {
  const { id } = req.params;
  return res(ctx.json({ id, name: "John" }));
});
```

## Correct

```typescript
// v2 resolver receives a single info object
http.get("/api/user/:id", ({ request, params, cookies }) => {
  const { id } = params;
  return HttpResponse.json({ id, name: "John" });
});
```

## Resolver Info Properties

| Property    | Type                                 | Description                                                                |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `request`   | `Request`                            | Standard Fetch API Request object                                          |
| `params`    | `Record<string, string \| string[]>` | Path parameters. Repeating params (`:segments+`) yield an array of strings |
| `cookies`   | `Record<string, string>`             | Parsed request cookies                                                     |
| `requestId` | `string`                             | Unique request identifier                                                  |
| `finalize`  | `Function`                           | Schedule a cleanup callback to run after the resolver completes            |

## Why

v2 aligns with web standards. The resolver receives a Fetch API `Request` object instead of MSW's custom `req`. Responses are standard `Response` objects (or `HttpResponse`), not composed via `res(ctx.*)`.
