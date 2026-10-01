---
title: Use `server.boundary()` for Concurrent Test Isolation
impact: HIGH
description: Wrap concurrent tests in `server.boundary()` to prevent `server.use()` overrides from leaking across parallel tests.
tags: testing, concurrent, boundary, isolation, parallel
---

# Use `server.boundary()` for Concurrent Test Isolation

## Problem

`it.concurrent` runs tests in parallel. Without `server.boundary()`, `server.use()` in one concurrent test affects all other concurrent tests.

## Incorrect

```typescript
// BUG: concurrent tests share the same server — overrides leak
it.concurrent("shows admin view", async () => {
  server.use(http.get("/api/user", () => HttpResponse.json({ role: "admin" })));
  // Another concurrent test may see this override!
});

it.concurrent("shows member view", async () => {
  server.use(
    http.get("/api/user", () => HttpResponse.json({ role: "member" })),
  );
  // May actually get 'admin' from the other test's override
});
```

## Correct

```typescript
it.concurrent(
  "shows admin view",
  server.boundary(async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json({ role: "admin" })),
    );
    // Override is scoped to this boundary — invisible to other tests
  }),
);

it.concurrent(
  "shows member view",
  server.boundary(async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json({ role: "member" })),
    );
    // Gets 'member' as expected — boundary prevents leakage
  }),
);
```

## Why

`server.boundary()` creates an isolated handler scope. Any handlers added via `server.use()` inside the boundary are only visible to requests originating from that boundary's execution context. This is essential for `it.concurrent` and any parallel test runner.
