---
title: Set `onUnhandledFrame: 'error'` to Catch Missing Handlers
impact: HIGH
description: Configure the server to error on unhandled requests so a missing handler fails the request loudly instead of passing it through to the network.
tags: testing, unhandled, error, configuration, strictness
---

# Set `onUnhandledFrame: 'error'`

## Problem

The default `onUnhandledFrame` behavior is `'warn'` — unexpected requests print a warning and pass through to the actual network. Tests can pass even though a handler is missing.

## Incorrect

```typescript
// Default: unhandled requests produce a console warning and pass through
const server = setupServer(...handlers);
server.listen(); // default: { onUnhandledFrame: 'warn' }

// If you forget a handler for /api/settings, the test hits the real API.
// The only sign is a console warning, or a network error with no clear message.
```

## Correct

```typescript
const server = setupServer(...handlers);

beforeAll(() => {
  server.listen({ onUnhandledFrame: "error" });
});

// Now a missing handler prints:
// [MSW] Error: intercepted a request without a matching request handler:
//   GET /api/settings
// and the request fails: fetch rejects with a TypeError ("fetch failed" in Node.js).
// The test fails where the code under test surfaces that error.
```

## Options

| Strategy                      | Behavior                                                                                                                                                                                                                               |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `'warn'` (default)            | Console warning, request passes through                                                                                                                                                                                                |
| `'error'`                     | Console error; the request fails with a network error (`TypeError`)                                                                                                                                                                    |
| `'bypass'`                    | Silent, request passes through                                                                                                                                                                                                         |
| `({ frame, defaults }) => {}` | Custom function for conditional handling. Opts you out of the built-in common-asset exemption — re-apply it with `isCommonAssetRequest(frame.data.request)` after `frame instanceof HttpNetworkFrame` (see `references/server-api.md`) |

## Why

`onUnhandledFrame: 'error'` turns a missing handler into a failed request and a clear console error, instead of a silent call to the real network. This catches typos in URLs, forgotten handlers for new endpoints, and accidental real network requests during testing.
