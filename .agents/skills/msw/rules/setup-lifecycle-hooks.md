---
title: Always Use beforeAll/afterEach/afterAll Lifecycle Pattern
impact: CRITICAL
description: Start the server in beforeAll, reset handlers in afterEach, close in afterAll. Missing any of these causes handler leakage between tests.
tags: setup, lifecycle, beforeAll, afterEach, afterAll, testing, leakage
---

# Always Use beforeAll/afterEach/afterAll Lifecycle Pattern

## Problem

Developers only call `server.listen()` in `beforeAll` but forget `resetHandlers()` in `afterEach`. This causes per-test overrides added via `server.use()` to leak into subsequent tests, creating flaky test suites.

## Incorrect

```typescript
// BUG: missing afterEach — handlers leak between tests
import { server } from "./mocks/node";

beforeAll(() => server.listen());
afterAll(() => server.close());

test("shows user profile", async () => {
  // This override leaks into the next test!
  server.use(http.get("/api/user", () => HttpResponse.json({ name: "Jane" })));
  // ...
});

test("shows default user", async () => {
  // BUG: still gets Jane from the leaked handler above
  // ...
});
```

## Correct

```typescript
import { server } from "./mocks/node";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test("shows user profile", async () => {
  server.use(http.get("/api/user", () => HttpResponse.json({ name: "Jane" })));
  // ...
});

test("shows default user", async () => {
  // Gets default handler from handlers.ts — override was reset
  // ...
});
```

## Lifecycle Hooks

| Hook        | Method                   | Purpose                                            |
| ----------- | ------------------------ | -------------------------------------------------- |
| `beforeAll` | `server.listen()`        | Start intercepting requests                        |
| `afterEach` | `server.resetHandlers()` | Remove runtime overrides, restore initial handlers |
| `afterAll`  | `server.close()`         | Stop intercepting, clean up                        |

## Why

`resetHandlers()` removes handlers added via `server.use()` and restores the initial handlers passed to `setupServer()`. Without it, per-test overrides persist, causing later tests to receive unexpected responses. This is the #1 cause of flaky MSW tests.
