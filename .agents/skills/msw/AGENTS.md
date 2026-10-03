# MSW v2 — Complete Guide

> This document is for AI agents and LLMs to follow when writing, reviewing, or debugging MSW (Mock Service Worker) handlers, server setup, and test patterns. It compiles all rules and references into a single executable guide.

**Baseline:** msw ^2.15.0

---

## Abstract

MSW (Mock Service Worker) is a network-level API mocking library for JavaScript/TypeScript. It intercepts HTTP and GraphQL requests using the `http` and `graphql` namespaces, returning mock responses via `HttpResponse`; it also mocks Server-Sent Events with `sse` and WebSocket connections with `ws`. In tests, `setupServer` (from `msw/node`) intercepts at the request-client level; in the browser, `setupWorker` (from `msw/browser`) uses a Service Worker; React Native uses `msw/native`. MSW v2 completely removed the v1 `rest` namespace, `res(ctx.*)` response composition, and `(req, res, ctx)` resolver signature. This guide covers all v2 patterns, testing best practices, and migration from v1.

---

## Table of Contents

1. [Handler Design](#1-handler-design) — CRITICAL
2. [Setup & Lifecycle](#2-setup--lifecycle) — CRITICAL
3. [Request Reading](#3-request-reading) — HIGH
4. [Response Construction](#4-response-construction) — HIGH
5. [Test Patterns](#5-test-patterns) — HIGH
6. [GraphQL](#6-graphql) — MEDIUM
7. [Utilities](#7-utilities) — MEDIUM

---

## 1. Handler Design

**Impact: CRITICAL**

### Rule: Use `http` Namespace Instead of `rest`

The `rest` namespace was removed in MSW 2.0. All HTTP handlers use `http`.

```typescript
// INCORRECT — rest does not exist in v2
import { rest } from "msw";
rest.get("/api/user", (req, res, ctx) => res(ctx.json({ name: "John" })));

// CORRECT
import { http, HttpResponse } from "msw";
http.get("/api/user", () => HttpResponse.json({ name: "John" }));
```

### Rule: Never Put Query Parameters in Handler URL Predicates

MSW matches by pathname only. Query parameters are stripped from the predicate, so including them widens the handler to every request on that path rather than narrowing it. MSW logs a warning when it finds them.

```typescript
// INCORRECT — query string stripped; this matches ALL '/post' requests
http.get("/post?id=1", resolver);

// CORRECT — read query params inside the resolver
http.get("/post", ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return HttpResponse.json({ id });
});
```

### Rule: Use v2 Destructured Resolver Signature

v2 resolvers receive a single info object: `{ request, params, cookies, requestId }`.

```typescript
// INCORRECT — v1 triple signature
http.get("/api/user/:id", (req, res, ctx) => {
  return res(ctx.json({ id: req.params.id }));
});

// CORRECT — v2 destructured info object
http.get("/api/user/:id", ({ request, params, cookies }) => {
  return HttpResponse.json({ id: params.id });
});
```

Resolver info properties:

| Property    | Type                                 | Description                                                                |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `request`   | `Request`                            | Standard Fetch API Request object                                          |
| `params`    | `Record<string, string \| string[]>` | Path parameters. Repeating params (`:segments+`) yield an array of strings |
| `cookies`   | `Record<string, string>`             | Parsed request cookies                                                     |
| `requestId` | `string`                             | Unique request identifier                                                  |
| `finalize`  | `Function`                           | Schedule a cleanup callback to run after the resolver completes            |

### Rule: Use `HttpResponse` Static Methods Instead of `res(ctx.*)`

v2 uses standard `Response` objects constructed via `HttpResponse`.

```typescript
// INCORRECT — res() and ctx are removed
http.get("/api/user", (req, res, ctx) => {
  return res(ctx.status(200), ctx.json({ name: "John" }));
});

// CORRECT
http.get("/api/user", () => {
  return HttpResponse.json({ name: "John" }, { status: 200 });
});
```

Complete v1 to v2 mapping:

| v1 Pattern                   | v2 Equivalent                                    |
| ---------------------------- | ------------------------------------------------ |
| `res(ctx.json(data))`        | `HttpResponse.json(data)`                        |
| `res(ctx.text(str))`         | `HttpResponse.text(str)`                         |
| `res(ctx.xml(str))`          | `HttpResponse.xml(str)`                          |
| `res(ctx.body(str))`         | `new HttpResponse(str)`                          |
| `res(ctx.status(code))`      | `new HttpResponse(null, { status: code })`       |
| `res(ctx.set(name, val))`    | Include in `headers` init                        |
| `res(ctx.delay(ms), ...)`    | `await delay(ms); return HttpResponse.json(...)` |
| `res(ctx.cookie(name, val))` | `headers: { 'Set-Cookie': 'name=val' }`          |
| `res.networkError(msg)`      | `HttpResponse.error()`                           |
| `res.once(...)`              | `http.get(url, resolver, { once: true })`        |

### WebSocket Handlers (`ws`)

MSW mocks WebSocket connections too, through the `ws` namespace:

```typescript
import { ws } from "msw";

const chat = ws.link("wss://chat.example.com");

export const handlers = [
  chat.addEventListener("connection", ({ client }) => {
    client.addEventListener("message", (event) => {
      client.send(`echo: ${event.data}`);
    });
  }),
];
```

`ws.link(url: string | URL | RegExp)` matches an endpoint; the `connection` event fires whenever a client opens a matching connection. `client.send()` accepts `string`, `Blob` and `ArrayBuffer`; `link.broadcast()` / `link.broadcastExcept()` reach every connected client; `server.connect()` forwards to the real server — without it, the handler _is_ the server. See `references/handler-api.md` for the full member list.

---

## 2. Setup & Lifecycle

**Impact: CRITICAL**

### Rule: Import Server/Worker from Correct Subpaths

```typescript
// INCORRECT
import { setupServer } from "msw";

// CORRECT
import { setupServer } from "msw/node"; // Node.js (tests, SSR)
import { setupWorker } from "msw/browser"; // Browser (Storybook, dev)
import { http, HttpResponse } from "msw"; // Handlers and utilities
```

| Export                                                                           | Import from     |
| -------------------------------------------------------------------------------- | --------------- |
| `http`, `graphql`, `sse`, `ws`, `HttpResponse`, `delay`, `bypass`, `passthrough` | `'msw'`         |
| `setupServer`                                                                    | `'msw/node'`    |
| `setupWorker`                                                                    | `'msw/browser'` |
| `setupServer` (React Native)                                                     | `'msw/native'`  |

`msw/node` pulls in Node.js modules such as `http` that do not exist in React Native — replace any `msw/node` import in React Native code with `msw/native`.

### Rule: Always Use beforeAll/afterEach/afterAll Lifecycle Pattern

Missing `afterEach(() => server.resetHandlers())` causes handlers added via `server.use()` to leak between tests.

```typescript
// INCORRECT — handlers leak
beforeAll(() => server.listen());
afterAll(() => server.close());

// CORRECT
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

| Hook        | Method                   | Purpose                     |
| ----------- | ------------------------ | --------------------------- |
| `beforeAll` | `server.listen()`        | Start intercepting requests |
| `afterEach` | `server.resetHandlers()` | Remove runtime overrides    |
| `afterAll`  | `server.close()`         | Stop intercepting, clean up |

### Rule: Organize Mocks in `src/mocks/`

```
src/mocks/
├── handlers.ts    # Shared happy-path handlers
├── node.ts        # setupServer(...handlers)
└── browser.ts     # setupWorker(...handlers)
```

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user", () => HttpResponse.json({ name: "John" })),
  http.get("/api/posts", () => HttpResponse.json([{ id: 1, title: "Post" }])),
];

// src/mocks/node.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";
export const server = setupServer(...handlers);

// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";
export const worker = setupWorker(...handlers);
```

Browser setup also needs the worker script on disk before `worker.start()` will work:

```bash
npx msw init <PUBLIC_DIR> --save
```

This copies `mockServiceWorker.js` into your public directory — commit it, and verify it is served at `/mockServiceWorker.js`. The `--save` flag records `msw.workerDirectory` in `package.json`, so the script is copied again automatically whenever you install `msw`.

---

## 3. Request Reading

**Impact: HIGH**

### Rule: Clone Request Before Reading Body in Lifecycle Events

Reading `request.json()` consumes the body stream. In lifecycle events, clone first.

```typescript
// INCORRECT — body consumed, handler gets empty body
server.events.on("request:start", async ({ request }) => {
  const body = await request.json();
});

// CORRECT
server.events.on("request:start", async ({ request }) => {
  const body = await request.clone().json();
});
```

### Rule: Always Await Body Reading Methods

v2 uses the standard Fetch API Request — body reading is always async.

```typescript
// INCORRECT — request.body is a ReadableStream
http.post("/api/user", ({ request }) => {
  const body = request.body;
});

// CORRECT
http.post("/api/user", async ({ request }) => {
  const body = await request.json();
});
```

| Method                        | Returns       | Use for               |
| ----------------------------- | ------------- | --------------------- |
| `await request.json()`        | Parsed object | JSON payloads         |
| `await request.text()`        | String        | Plain text, HTML      |
| `await request.formData()`    | `FormData`    | Form submissions      |
| `await request.arrayBuffer()` | `ArrayBuffer` | Binary data           |
| `await request.blob()`        | `Blob`        | Binary with MIME type |

---

## 4. Response Construction

**Impact: HIGH**

### Rule: Use `HttpResponse` for Cookie Mocking

Native `Response` forbids `Set-Cookie` headers. `HttpResponse` bypasses this.

```typescript
// INCORRECT — Set-Cookie silently dropped
new Response(null, { headers: { "Set-Cookie": "token=abc" } });

// CORRECT
new HttpResponse(null, { headers: { "Set-Cookie": "token=abc" } });
```

### Rule: Use `HttpResponse.error()` for Network Failures

```typescript
// INCORRECT — MSW handles this as an unhandled resolver exception, not a network error
http.get("/api/data", () => {
  throw new Error("fail");
});

// CORRECT — simulates TypeError: Failed to fetch
http.get("/api/data", () => HttpResponse.error());
```

Throwing a `Response`/`HttpResponse` is different, and is supported: a thrown `Response` is used as the mocked response, which short-circuits a shared guard.

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

### Rule: Use `sse()` for Server-Sent Events, ReadableStream for Chunked

```typescript
import { sse } from "msw";

// Server-Sent Events — the sse handler owns the wire format and headers
export const handlers = [
  sse<{ greeting: string }>("/api/events", ({ client }) => {
    client.send({ id: "abc-123", event: "greeting", data: "Hello, John!" });
    client.close();
  }),
];
```

```typescript
import { http, HttpResponse, delay } from "msw";

// Non-SSE chunked transfer — a ReadableStream body is still the right tool
http.get("/api/stream", () => {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode("chunk1"));
      await delay(100);
      controller.enqueue(new TextEncoder().encode("chunk2"));
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/plain" },
  });
});
```

---

## 5. Test Patterns

**Impact: HIGH**

### Rule: Test Application Behavior, Not Request Mechanics

```typescript
// INCORRECT — tests implementation
expect(fetch).toHaveBeenCalledWith("/api/login", expect.any(Object));

// CORRECT — tests observable behavior
await waitFor(() => {
  expect(screen.getByText("Welcome, John!")).toBeInTheDocument();
});
```

Where the request's _validity_ is the point, validate it inside the handler and return an error response. **Exception:** one-way requests that leave no trace in the application (analytics, monitoring) may be asserted directly via the life-cycle events API (`server.events.on('request:start', ...)`).

### Rule: Use `server.use()` for Per-Test Overrides

```typescript
test('shows error state', async () => {
  server.use(
    http.get('/api/user', () => new HttpResponse(null, { status: 500 }))
  )
  render(<UserProfile />)
  await waitFor(() => {
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
})
```

### Rule: Use `server.boundary()` for Concurrent Test Isolation

```typescript
it.concurrent(
  "admin view",
  server.boundary(async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json({ role: "admin" })),
    );
    // Override scoped to this boundary
  }),
);

it.concurrent(
  "member view",
  server.boundary(async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json({ role: "member" })),
    );
    // Isolated from admin test
  }),
);
```

### Rule: Set `onUnhandledRequest: 'error'`

```typescript
// Default 'warn' silently passes through — missing handlers don't fail tests
server.listen({ onUnhandledRequest: "error" });
```

| Strategy           | Behavior                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `'warn'` (default) | Console warning, passes through                                                                                              |
| `'error'`          | Throws, test fails                                                                                                           |
| `'bypass'`         | Silent, passes through                                                                                                       |
| Custom function    | Conditional handling. Opts you out of the built-in common-asset exemption — re-apply it with `isCommonAssetRequest(request)` |

---

## 6. GraphQL

**Impact: MEDIUM**

### Rule: Return `{ data }` / `{ errors }` Directly

```typescript
// INCORRECT — ctx.data() removed in v2
graphql.query("GetUser", (req, res, ctx) => res(ctx.data({ user: {} })));

// CORRECT
graphql.query("GetUser", ({ variables }) => {
  return HttpResponse.json({
    data: { user: { id: variables.id, name: "John" } },
  });
});
```

### Rule: Use `graphql.link()` for Multiple Endpoints

```typescript
const github = graphql.link("https://api.github.com/graphql");
const internal = graphql.link("/graphql");

const handlers = [
  github.query("GetUser", ({ variables }) => {
    return HttpResponse.json({ data: { user: { login: variables.login } } });
  }),
  internal.query("GetUser", ({ variables }) => {
    return HttpResponse.json({ data: { user: { id: variables.id } } });
  }),
];
```

---

## 7. Utilities

**Impact: MEDIUM**

### Rule: `bypass()` vs `passthrough()` — Not Interchangeable

```typescript
import { bypass, passthrough } from "msw";

// passthrough() — let intercepted request through to real server
http.get("/api/flags", () => {
  if (process.env.USE_REAL_FLAGS) return passthrough();
  return HttpResponse.json({ enabled: true });
});

// bypass() — make additional request that won't be intercepted
http.get("/api/user", async ({ request }) => {
  const real = await fetch(bypass(request));
  const data = await real.json();
  return HttpResponse.json({ ...data, extra: "mocked" });
});
```

| Function          | Creates new request? | Original continues? | Use case            |
| ----------------- | -------------------- | ------------------- | ------------------- |
| `passthrough()`   | No                   | Yes                 | Conditional mocking |
| `bypass(request)` | Yes                  | No                  | Response patching   |

### Rule: Use Explicit Milliseconds with `delay()`

```typescript
// INCORRECT — in Node.js the realistic delay is cut down ("negated to prevent
// it affecting the test performance"), so neither is observable in a test
await delay();
await delay("real"); // Sets the same realistic response time — same result

// CORRECT
await delay(200); // Always waits 200ms
await delay("infinite"); // Never resolves — test timeout handling
```

| Usage               | Browser           | Node.js                          |
| ------------------- | ----------------- | -------------------------------- |
| `delay()`           | Random ~100-400ms | Negated                          |
| `delay(ms)`         | Waits `ms`        | Waits `ms`                       |
| `delay('real')`     | Random ~100-400ms | Negated — identical to `delay()` |
| `delay('infinite')` | Never resolves    | Never resolves                   |
