# Server API Reference

## Table of Contents

- [setupServer](#setupserver-nodejs)
- [setupWorker](#setupworker-browser)
- [Server Methods](#server-methods)
- [Worker Methods](#worker-methods)
- [Lifecycle Events](#lifecycle-events)
- [onUnhandledRequest Strategies](#onunhandledrequest-strategies)
- [server.boundary()](#serverboundary)

## setupServer (Node.js)

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

const server = setupServer(...handlers);
```

Used for Node.js environments: test runners (Vitest, Jest), scripts, and server-side applications.

## setupWorker (Browser)

```typescript
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

const worker = setupWorker(...handlers);
```

Used for browser environments: development servers, Storybook, browser-based tests.

## Server Methods

| Method                         | Description                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| `.listen(options?)`            | Start intercepting requests                                  |
| `.close()`                     | Stop intercepting, clean up                                  |
| `.use(...handlers)`            | Prepend runtime handlers (override)                          |
| `.resetHandlers(...handlers?)` | Remove runtime handlers, optionally replace initial handlers |
| `.restoreHandlers()`           | Mark used one-time handlers as unused again                  |
| `.listHandlers()`              | Return array of all active handlers                          |
| `.boundary(callback)`          | Create isolated handler scope for concurrent tests           |
| `.events`                      | EventEmitter for lifecycle events                            |

### .listen()

```typescript
server.listen();

// With options
server.listen({
  onUnhandledRequest: "error",
});
```

### .close()

```typescript
server.close();
```

### .use()

Prepends runtime handlers that take priority over initial handlers:

```typescript
server.use(
  http.get("/api/user", () => HttpResponse.json({ name: "Override" })),
);
```

Runtime handlers are checked first (most recently added wins). They are removed by `resetHandlers()`.

### .resetHandlers()

```typescript
// Remove all runtime handlers, keep initial handlers
server.resetHandlers();

// Replace initial handlers entirely
server.resetHandlers(
  http.get("/api/user", () => HttpResponse.json({ name: "New default" })),
);
```

### .restoreHandlers()

Restores one-time handlers that have already been used so they can fire again:

```typescript
server.restoreHandlers();
```

### .listHandlers()

```typescript
const handlers = server.listHandlers();
console.log(handlers.length);
```

## Worker Methods

| Method               | Description                                                             |
| -------------------- | ----------------------------------------------------------------------- |
| `.start(options?)`   | Register service worker, start intercepting                             |
| `.stop()`            | Disable mocking for the current client (does NOT unregister the worker) |
| `.use(...handlers)`  | Same as server                                                          |
| `.resetHandlers()`   | Same as server                                                          |
| `.restoreHandlers()` | Same as server                                                          |
| `.listHandlers()`    | Same as server                                                          |

### .start()

```typescript
await worker.start();

// With options
await worker.start({
  onUnhandledRequest: "error",
  serviceWorker: {
    url: "/mockServiceWorker.js",
  },
  quiet: true, // suppress "[MSW] Mocking enabled" console message
});
```

### .stop()

```typescript
worker.stop();
```

`worker.stop()` is not a true opposite of `worker.start()`. It does **not** unregister the service worker — it instructs the worker to disable API mocking for the current client (page) only, which is what allows multiple open clients to hold different interception states. The stopped state does **not** survive a page reload; reloading resumes mocking.

## Lifecycle Events

7 event types available on `server.events` / `worker.events`:

| Event                | Payload                            | Description             |
| -------------------- | ---------------------------------- | ----------------------- |
| `request:start`      | `{ request, requestId }`           | Request intercepted     |
| `request:match`      | `{ request, requestId }`           | Handler found           |
| `request:unhandled`  | `{ request, requestId }`           | No handler found        |
| `request:end`        | `{ request, requestId }`           | Request processing done |
| `response:mocked`    | `{ request, requestId, response }` | Mocked response sent    |
| `response:bypass`    | `{ request, requestId, response }` | Real response received  |
| `unhandledException` | `{ request, requestId, error }`    | Handler threw error     |

### Subscribing to events

```typescript
server.events.on("request:start", ({ request, requestId }) => {
  console.log("Intercepted:", request.method, request.url);
});

server.events.on("response:mocked", ({ request, response }) => {
  console.log("Mocked:", request.url, response.status);
});

server.events.on("unhandledException", ({ request, error }) => {
  console.error("Handler error for", request.url, error);
});
```

### Clone before reading body

```typescript
// BAD: consumes the request body, breaking downstream handlers
server.events.on("request:start", async ({ request }) => {
  const body = await request.json();
});

// GOOD: clone before reading
server.events.on("request:start", async ({ request }) => {
  const body = await request.clone().json();
});
```

### Removing event listeners

```typescript
const listener = ({ request }) => {
  console.log(request.url);
};

server.events.on("request:start", listener);
server.events.removeListener("request:start", listener);

// Or remove all listeners
server.events.removeAllListeners();
```

## onUnhandledRequest Strategies

| Strategy           | Behavior                                |
| ------------------ | --------------------------------------- |
| `'warn'` (default) | Console warning, request passes through |
| `'error'`          | Throws error, fails test                |
| `'bypass'`         | Silent, request passes through          |
| Custom function    | Conditional handling                    |

**Built-in asset exemption:** for the string strategies, MSW first checks `isCommonAssetRequest(request)` and silently ignores common static asset requests, so they are never treated as unhandled. These never warn or error.

### Built-in strategies

```typescript
server.listen({ onUnhandledRequest: "warn" }); // default
server.listen({ onUnhandledRequest: "error" }); // recommended for tests
server.listen({ onUnhandledRequest: "bypass" }); // silent passthrough
```

### Custom strategy

```typescript
import { isCommonAssetRequest } from "msw";

server.listen({
  onUnhandledRequest(request, print) {
    // Supplying a custom callback OPTS OUT of MSW's built-in
    // common-asset exemption — re-apply it manually.
    if (isCommonAssetRequest(request)) {
      return;
    }

    const url = new URL(request.url);
    if (url.hostname === "cdn.example.com") {
      return;
    }

    print.error();
  },
});
```

## server.boundary()

Isolates handler scope for parallel execution. Handlers added via `server.use()` inside a boundary are only visible within that boundary's execution context.

```typescript
const isolated = server.boundary(async () => {
  server.use(http.get("/api/user", () => HttpResponse.json({ role: "admin" })));
  // This override is only visible within this boundary
});

await isolated();
```

### Use with concurrent tests

```typescript
it.concurrent(
  "admin flow",
  server.boundary(async () => {
    server.use(http.get("/api/me", () => HttpResponse.json({ role: "admin" })));
    // Only this test sees the admin override
  }),
);

it.concurrent(
  "guest flow",
  server.boundary(async () => {
    server.use(http.get("/api/me", () => HttpResponse.json({ role: "guest" })));
    // Only this test sees the guest override
  }),
);
```
