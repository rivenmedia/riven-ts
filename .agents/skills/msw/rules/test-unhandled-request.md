---
title: Set `onUnhandledRequest: 'error'` to Catch Missing Handlers
impact: HIGH
description: Configure the server to throw on unhandled requests so missing handlers fail tests loudly instead of silently passing through.
tags: testing, unhandled, error, configuration, strictness
---

# Set `onUnhandledRequest: 'error'`

## Problem

The default `onUnhandledRequest` behavior is `'warn'` — unexpected requests print a warning but silently pass through to the actual network. Tests pass even though a handler is missing.

## Incorrect

```typescript
// Default: unhandled requests produce a console warning and pass through
const server = setupServer(...handlers);
server.listen(); // default: { onUnhandledRequest: 'warn' }

// If you forget a handler for /api/settings, the test silently
// hits the real API (or fails with a network error, not a clear message)
```

## Correct

```typescript
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

// Now a missing handler throws:
// [MSW] Error: intercepted a request without a matching request handler:
//   GET /api/settings
// This fails the test immediately with a clear error message.
```

## Options

| Strategy           | Behavior                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'warn'` (default) | Console warning, request passes through                                                                                                                                           |
| `'error'`          | Throws error, test fails                                                                                                                                                          |
| `'bypass'`         | Silent, request passes through                                                                                                                                                    |
| `(request) => {}`  | Custom function for conditional handling. Opts you out of the built-in common-asset exemption — re-apply it with `isCommonAssetRequest(request)` (see `references/server-api.md`) |

## Why

`onUnhandledRequest: 'error'` turns missing handlers into immediate test failures with clear error messages. This catches typos in URLs, forgotten handlers for new endpoints, and accidental real network requests during testing.
