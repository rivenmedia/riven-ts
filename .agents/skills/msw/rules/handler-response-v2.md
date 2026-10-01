---
title: Use `HttpResponse` Static Methods Instead of `res(ctx.*)`
impact: CRITICAL
description: v2 uses `HttpResponse.json()`, `HttpResponse.text()`, etc. The `res` and `ctx` helpers are removed.
tags: handler, response, HttpResponse, ctx, res, v2, migration
---

# Use `HttpResponse` Static Methods Instead of `res(ctx.*)`

## Problem

v1 response composition `res(ctx.status(200), ctx.json(...))` doesn't exist in v2. Responses are now standard Response objects constructed via `HttpResponse`.

## Incorrect

```typescript
// BUG: res() and ctx are removed in v2
http.get("/api/user", (req, res, ctx) => {
  return res(
    ctx.status(200),
    ctx.json({ name: "John" }),
    ctx.set("X-Custom", "value"),
  );
});
```

## Correct

```typescript
http.get("/api/user", () => {
  return HttpResponse.json(
    { name: "John" },
    {
      status: 200,
      headers: { "X-Custom": "value" },
    },
  );
});
```

## v1 to v2 Response Mapping

| v1 Pattern                   | v2 Equivalent                                                   |
| ---------------------------- | --------------------------------------------------------------- |
| `res(ctx.json(data))`        | `HttpResponse.json(data)`                                       |
| `res(ctx.text(str))`         | `HttpResponse.text(str)`                                        |
| `res(ctx.xml(str))`          | `HttpResponse.xml(str)`                                         |
| `res(ctx.status(code))`      | `new HttpResponse(null, { status: code })`                      |
| `res(ctx.set(name, val))`    | `new HttpResponse(body, { headers: { [name]: val } })`          |
| `res(ctx.delay(ms), ...)`    | `await delay(ms); return HttpResponse.json(...)`                |
| `res(ctx.cookie(name, val))` | `HttpResponse.json(data, { headers: { 'Set-Cookie': '...' } })` |
| `res.networkError(msg)`      | `HttpResponse.error()`                                          |
| `res.once(...)`              | `http.get(url, resolver, { once: true })`                       |

## Why

v2 aligns with the Fetch API standard. `HttpResponse` extends the native `Response` class, making mock responses consistent with real responses and enabling features like `Set-Cookie` header support.
