---
title: Use `HttpResponse.error()` for Network Failures
impact: HIGH
description: Simulate network errors with `HttpResponse.error()`, not by throwing inside resolvers.
tags: response, error, network, HttpResponse.error
---

# Use `HttpResponse.error()` for Network Failures

## Problem

Throwing an error inside a resolver doesn't simulate a network failure. MSW treats it as an unhandled exception in the response resolver — it emits the `unhandledException` life-cycle event, and the client never sees a network error. Use `HttpResponse.error()`, which produces a `TypeError: Failed to fetch` on the client side.

## Incorrect

```typescript
// BUG: MSW handles this as an unhandled resolver exception, not a network failure
http.get("/api/data", () => {
  throw new Error("Network failure");
});
```

## Correct

```typescript
// Simulates a network error (TypeError: Failed to fetch)
http.get("/api/data", () => {
  return HttpResponse.error();
});
```

## Why

`HttpResponse.error()` creates a `Response` with `type: "error"`, which the Fetch API translates to a `TypeError: Failed to fetch`. This is what applications actually see during real network failures (DNS errors, connection refused, etc.).

Throwing a plain `Error` inside a resolver is caught by MSW and surfaced on the `unhandledException` life-cycle event (see `references/server-api.md`) — it is reported as a bug in your handler, not as a network failure. To model a _server_ error, return a valid error `Response` instead.

Throwing a `Response`/`HttpResponse` is different, and is supported: if you throw a `Response` instance at any point in the response resolver, that response is used as the mocked response. This is useful for short-circuiting out of a shared guard.

```typescript
function withAuthorization(request: Request) {
  if (!request.headers.get("authorization")) {
    throw HttpResponse.text("Unauthorized", { status: 401 });
  }
}

http.get("/resource", ({ request }) => {
  withAuthorization(request);
  return HttpResponse.json({ id: "abc-123" });
});
```
