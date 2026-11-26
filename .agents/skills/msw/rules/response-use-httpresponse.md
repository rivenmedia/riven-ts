---
title: Use `HttpResponse` for Cookie Mocking Instead of Native `Response`
impact: HIGH
description: "`HttpResponse` supports `Set-Cookie` headers. In the browser, the native `Response` constructor drops them."
tags: response, HttpResponse, cookies, Set-Cookie, forbidden-header
---

# Use `HttpResponse` for Cookie Mocking Instead of Native `Response`

## Problem

In the browser, the Fetch API forbids the `Set-Cookie` header on a constructed `Response`: `new Response()` with `Set-Cookie` silently drops it. Node.js does not filter the header, so a Node test can pass with a native `Response` while the same handler loses the cookie in the browser.

## Incorrect

```typescript
// BUG (browser): Set-Cookie is a forbidden response header in native Response
http.get("/api/login", () => {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "session=abc123; Path=/; HttpOnly",
    },
  });
});
// In the browser, the Set-Cookie header is silently dropped
```

## Correct

```typescript
import { http, HttpResponse } from "msw/http";

http.get("/api/login", () => {
  return HttpResponse.json(
    { success: true },
    {
      headers: {
        "Set-Cookie": "session=abc123; Path=/; HttpOnly",
      },
    },
  );
});
```

## When to Use Which

For responses that don't need `Set-Cookie`, you can use either `new Response()` or `HttpResponse`. Both work. Use `HttpResponse` when you need cookies or want consistency.

## Why

In the browser, the Fetch API spec forbids `Set-Cookie` in the `Response` constructor's `Headers`. MSW's `HttpResponse` extends `Response` but keeps the header for mock responses, so mock cookies are testable. Node.js's `Response` does not filter the header (checked on Node 26 with msw 3.0.3), so only `HttpResponse` behaves the same in both environments.
