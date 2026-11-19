---
name: msw
description: >
  MSW (Mock Service Worker) v2 and v3 best practices, patterns, and API guidance for
  API mocking in JavaScript/TypeScript tests and development. Covers handler
  design, server setup, response construction, testing patterns, GraphQL, and
  v1-to-v2 and v2-to-v3 migration. Baseline: msw ^3.0.0.
  Triggers on: msw imports, http.get, http.post, HttpResponse, setupServer,
  setupWorker, graphql.query, sse, ws.link, mentions of "msw",
  "mock service worker", "api mocking", or "msw v3".
license: MIT
user-invocable: false
agentic: false
compatibility: "TypeScript/JavaScript projects using msw ^3.0.0 (audited against msw 3.0.3; Node.js >=22, TypeScript >=5.9)"
metadata:
  author: Anivar Aravind
  author_url: https://anivar.net
  version: 1.2.3
  tags: msw, mocking, api, testing, http, graphql, service-worker, fetch
---

# MSW (Mock Service Worker)

**IMPORTANT:** Your training data about `msw` may be outdated or incorrect — MSW v2 completely removed the `rest` namespace, `res(ctx.*)` response composition, and `(req, res, ctx)` resolver signature. MSW v3 is ESM-only and requires Node.js >=22 and TypeScript >=5.9. Always rely on this skill's rule files and the project's actual source code as the source of truth. Do not fall back on memorized v1 or v2 patterns when they conflict with the retrieved reference.

## When to Use MSW

MSW is for **API mocking at the network level** — intercepting HTTP, GraphQL, Server-Sent Events (`sse`) and WebSocket (`ws`) traffic in tests, Storybook, and local development without modifying application code.

| Need                                    | Recommended Tool                        |
| --------------------------------------- | --------------------------------------- |
| Test API integration (React, Vue, Node) | **MSW**                                 |
| Storybook API mocking                   | **MSW** (browser worker)                |
| Local development without backend       | **MSW** (browser worker)                |
| Unit testing pure functions             | Plain test doubles                      |
| E2E testing real APIs                   | Playwright/Cypress network interception |
| Mocking module internals                | `vi.mock()` / `jest.mock()`             |

## Quick Reference

```typescript
// Imports
import { http, HttpResponse } from "msw/http";
import { graphql } from "msw/graphql";
import { sse } from "msw/sse";
import { ws } from "msw/ws";
import { delay } from "msw/utils/delay";
import { bypass } from "msw/utils/bypass";
import { passthrough } from "msw/utils/passthrough";
import { setupServer } from "msw/node"; // tests, SSR
import { setupWorker } from "msw/browser"; // Storybook, dev
// React Native: import { setupServer } from '@msw/react-native'

// Handler
http.get("/api/user/:id", async ({ request, params, cookies }) => {
  return HttpResponse.json({ id: params.id, name: "John" });
});

// Server lifecycle (tests)
beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Per-test override
server.use(
  http.get("/api/user/:id", () => new HttpResponse(null, { status: 500 })),
);

// Concurrent test isolation
it.concurrent(
  "name",
  server.boundary(async () => {
    server.use(/* scoped overrides */);
  }),
);
```

## Rule Categories by Priority

| Priority | Category              | Impact   | Prefix      | Rules |
| -------- | --------------------- | -------- | ----------- | ----- |
| 1        | Handler Design        | CRITICAL | `handler-`  | 4     |
| 2        | Setup & Lifecycle     | CRITICAL | `setup-`    | 3     |
| 3        | Request Reading       | HIGH     | `request-`  | 2     |
| 4        | Response Construction | HIGH     | `response-` | 3     |
| 5        | Test Patterns         | HIGH     | `test-`     | 4     |
| 6        | GraphQL               | MEDIUM   | `graphql-`  | 2     |
| 7        | Utilities             | MEDIUM   | `util-`     | 2     |

## All 20 Rules

### Handler Design (CRITICAL)

| Rule                     | File                            | Summary                                                                     |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------- |
| Use `http` namespace     | `handler-use-http-namespace.md` | `rest` is removed in v2 — use `http.get()`, `http.post()`                   |
| No query params in URL   | `handler-no-query-params.md`    | Query params in predicates are stripped — the handler over-matches the path |
| v2 resolver signature    | `handler-resolver-v2.md`        | Use `({ request, params, cookies })`, not `(req, res, ctx)`                 |
| v2 response construction | `handler-response-v2.md`        | Use `HttpResponse.json()`, not `res(ctx.json())`                            |

### Setup & Lifecycle (CRITICAL)

| Rule                 | File                         | Summary                                                     |
| -------------------- | ---------------------------- | ----------------------------------------------------------- |
| Correct import paths | `setup-import-paths.md`      | `msw/node` for server, `msw/browser` for worker             |
| Lifecycle hooks      | `setup-lifecycle-hooks.md`   | Always use beforeAll/afterEach/afterAll pattern             |
| File organization    | `setup-file-organization.md` | Organize in `src/mocks/` with handlers, node, browser files |

### Request Reading (HIGH)

| Rule               | File                      | Summary                                               |
| ------------------ | ------------------------- | ----------------------------------------------------- |
| Clone in events    | `request-clone-events.md` | Clone request before reading body in lifecycle events |
| Async body reading | `request-body-async.md`   | Always `await request.json()` — body reading is async |

### Response Construction (HIGH)

| Rule                     | File                           | Summary                                                          |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------- |
| HttpResponse for cookies | `response-use-httpresponse.md` | In browsers, native Response drops Set-Cookie — use HttpResponse |
| Network errors           | `response-error-network.md`    | Use `HttpResponse.error()`; don't throw plain `Error`s           |
| Streaming                | `response-streaming.md`        | `sse()` for Server-Sent Events; ReadableStream for chunked       |

### Test Patterns (HIGH)

| Rule                 | File                            | Summary                                      |
| -------------------- | ------------------------------- | -------------------------------------------- |
| Test behavior        | `test-behavior-not-requests.md` | Assert on UI/state, not fetch call arguments |
| Per-test overrides   | `test-override-with-use.md`     | Use `server.use()` for error/edge case tests |
| Concurrent isolation | `test-concurrent-boundary.md`   | Wrap concurrent tests in `server.boundary()` |
| Unhandled requests   | `test-unhandled-request.md`     | Set `onUnhandledFrame: 'error'`              |

### GraphQL (MEDIUM)

| Rule             | File                         | Summary                                                                 |
| ---------------- | ---------------------------- | ----------------------------------------------------------------------- |
| Response shape   | `graphql-response-shape.md`  | Return `{ data }` / `{ errors }` via HttpResponse.json                  |
| Endpoint scoping | `graphql-scope-with-link.md` | One `graphql.link(url)` per API; a wildcard link matches every endpoint |

### Utilities (MEDIUM)

| Rule                  | File                            | Summary                                                                               |
| --------------------- | ------------------------------- | ------------------------------------------------------------------------------------- |
| bypass vs passthrough | `util-bypass-vs-passthrough.md` | `bypass()` = new request; `passthrough()` = let through                               |
| delay behavior        | `util-delay-behavior.md`        | `delay()` and `delay('real')` give no observable latency in Node.js — use explicit ms |

## Response Method Quick Reference

| Method                                 | Use for        |
| -------------------------------------- | -------------- |
| `HttpResponse.json(data, init?)`       | JSON responses |
| `HttpResponse.text(str, init?)`        | Plain text     |
| `HttpResponse.html(str, init?)`        | HTML content   |
| `HttpResponse.xml(str, init?)`         | XML content    |
| `HttpResponse.formData(fd, init?)`     | Form data      |
| `HttpResponse.arrayBuffer(buf, init?)` | Binary data    |
| `HttpResponse.error()`                 | Network errors |

## v1 to v2 Migration Quick Reference

| v1                                       | v2                                         |
| ---------------------------------------- | ------------------------------------------ |
| `import { rest } from 'msw'`             | `import { http, HttpResponse } from 'msw'` |
| `rest.get(url, resolver)`                | `http.get(url, resolver)`                  |
| `(req, res, ctx) => res(ctx.json(data))` | `() => HttpResponse.json(data)`            |
| `req.params`                             | `params` from resolver info                |
| `req.body`                               | `await request.json()`                     |
| `req.cookies`                            | `cookies` from resolver info               |
| `res.once(...)`                          | `http.get(url, resolver, { once: true })`  |
| `res.networkError()`                     | `HttpResponse.error()`                     |
| `ctx.delay(ms)`                          | `await delay(ms)`                          |
| `ctx.data({ user })`                     | `HttpResponse.json({ data: { user } })`    |

## v2 to v3 Migration Quick Reference

MSW 3.0.0 is **ESM-only** and requires **Node.js >=22** and **TypeScript >=5.9** (v6/v7 also supported). The headline change: handlers and utilities are imported from subpath entrypoints instead of the package root. `msw/graphql` needs the optional peer dependency `graphql` (>=16) installed. See `references/migration-v2-to-v3.md` for the complete guide (and the official codemods).

| v2                                                              | v3                                                                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `import { http, HttpResponse } from 'msw'`                      | `import { http, HttpResponse } from 'msw/http'`                                                                                                                    |
| `import { graphql } from 'msw'`                                 | `import { graphql } from 'msw/graphql'`                                                                                                                            |
| `import { ws } from 'msw'` / `import { sse } from 'msw'`        | `msw/ws` / `msw/sse`                                                                                                                                               |
| `import { delay } from 'msw'`                                   | `import { delay } from 'msw/utils/delay'`                                                                                                                          |
| `import { bypass, passthrough } from 'msw'`                     | `msw/utils/bypass`, `msw/utils/passthrough`                                                                                                                        |
| `graphql.query(...)` on the namespace                           | Removed — link-first: `graphql.link(url).query(...)`                                                                                                               |
| `import { setupServer } from 'msw/native'`                      | `@msw/react-native` package replaces the `msw/native` entrypoint                                                                                                   |
| `handleRequest()`                                               | Removed — use `getResponse()` (or experimental `defineNetwork()` for custom networks)                                                                              |
| `onUnhandledRequest: 'error'`                                   | `onUnhandledFrame: 'error'` — covers requests AND WebSocket connections. Plain JavaScript ignores a leftover `onUnhandledRequest`, so the default `'warn'` applies |
| Custom callback `(request, print)`                              | Single `{ frame, defaults }` object; narrow with `frame instanceof HttpNetworkFrame` (`msw/experimental`), call `defaults.warn()`                                  |
| `server.events.on('connection', ...)`                           | `server.events.on('websocket:connection', ...)` — life-cycle API only; the `ws` link's own `addEventListener('connection')` keeps its name                         |
| `GraphQLLinkHandlers` type                                      | Renamed to `GraphQLLink`                                                                                                                                           |
| `LifeCycleEventsMap` from `msw`                                 | Per-protocol maps (`HttpNetworkFrameEventMap`, `WebSocketNetworkFrameEventMap`) from `msw/experimental`                                                            |
| `worker.stop()` returns void                                    | Returns a Promise — `await worker.stop()` for in-flight critical scenarios                                                                                         |
| `:segments+` and `:path*` give an array (`['user', 'privacy']`) | One string with slashes (`'user/privacy'`). The type still allows an array, so TypeScript does not report `.join()` on it                                          |
| RegExp tokens in a string predicate (`'/user/:id(\\d+)'`)       | Match no request. Use a `RegExp` predicate                                                                                                                         |

New in v3: `msw/vite` plugin (serves the worker script — no more copying `mockServiceWorker.js` into public), GraphQL v17 and link-first subscriptions, the WebSocket Extension API, page-navigation and form-submission interception, passthrough request-header modification, and per-utility `msw/utils/*` modules for smaller bundles.

## References

| Reference               | Covers                                                             |
| ----------------------- | ------------------------------------------------------------------ |
| `handler-api.md`        | `http.*` and `graphql.*` methods, URL predicates, path params      |
| `response-api.md`       | `HttpResponse` class, all static methods, cookie handling          |
| `server-api.md`         | `setupServer`/`setupWorker`, lifecycle events, `boundary()`        |
| `test-patterns.md`      | Vitest/Jest setup, overrides, concurrent isolation, cache clearing |
| `migration-v1-to-v2.md` | Complete v1 to v2 breaking changes and migration guide             |
| `migration-v2-to-v3.md` | Complete v2 to v3 breaking changes, new APIs, and migration guide  |
| `anti-patterns.md`      | 10 common mistakes with BAD/GOOD examples                          |
