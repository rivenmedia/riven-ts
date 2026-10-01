---
title: Use `HttpResponse` for Cookie Mocking Instead of Native `Response`
impact: HIGH
description: "`HttpResponse` supports `Set-Cookie` headers. The native `Response` constructor forbids them."
tags: response, HttpResponse, cookies, Set-Cookie, forbidden-header
---

# Use `HttpResponse` for Cookie Mocking Instead of Native `Response`

## Problem

The native `Response` class forbids the `Set-Cookie` header in the constructor. Using `new Response()` with `Set-Cookie` silently drops the header.

## Incorrect

```typescript
// BUG: Set-Cookie is a forbidden response header in native Response
http.get("/api/login", () => {
  return new Response(JSON.stringify({ success: true }), {
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "session=abc123; Path=/; HttpOnly",
    },
  });
});
// The Set-Cookie header is silently dropped!
```

## Correct

```typescript
import { http, HttpResponse } from "msw";

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

The Fetch API spec forbids `Set-Cookie` in the `Response` constructor's `Headers`. MSW's `HttpResponse` extends `Response` but bypasses this restriction for mock responses, since mock cookies need to be testable.
