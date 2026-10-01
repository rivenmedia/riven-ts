# Migration Guide: MSW v1 to v2

## Table of Contents

- [Environment Requirements](#environment-requirements)
- [Import Changes](#import-changes)
- [Handler Namespace](#handler-namespace)
- [Resolver Signature](#resolver-signature)
- [Response Construction](#response-construction)
- [Request Property Changes](#request-property-changes)
- [GraphQL Changes](#graphql-changes)
- [Lifecycle Event Changes](#lifecycle-event-changes)
- [Removed APIs](#removed-apis)

## Environment Requirements

MSW v2 raises the minimum runtime floor. Verify these before applying any code change below.

| Requirement | Minimum                               |
| ----------- | ------------------------------------- |
| Node.js     | 18.0.0 (earlier versions unsupported) |
| TypeScript  | 4.7                                   |

Note: early Node.js 18 releases (e.g. v18.8.0) lack `request.formData()` support, which surfaces as a "multipart/form-data is not supported" error. Use the latest 18.x or newer.

## Import Changes

| v1                                       | v2                                          |
| ---------------------------------------- | ------------------------------------------- |
| `import { rest } from 'msw'`             | `import { http, HttpResponse } from 'msw'`  |
| `import { setupServer } from 'msw/node'` | Same (unchanged)                            |
| `import { setupWorker } from 'msw'`      | `import { setupWorker } from 'msw/browser'` |

```typescript
// BAD: v1 imports
import { rest } from "msw";
import { setupWorker } from "msw";

// GOOD: v2 imports
import { http, HttpResponse } from "msw";
import { setupWorker } from "msw/browser";
```

## Handler Namespace

The `rest` namespace is renamed to `http`:

| v1                           | v2                           |
| ---------------------------- | ---------------------------- |
| `rest.get(url, resolver)`    | `http.get(url, resolver)`    |
| `rest.post(url, resolver)`   | `http.post(url, resolver)`   |
| `rest.put(url, resolver)`    | `http.put(url, resolver)`    |
| `rest.patch(url, resolver)`  | `http.patch(url, resolver)`  |
| `rest.delete(url, resolver)` | `http.delete(url, resolver)` |
| `rest.all(url, resolver)`    | `http.all(url, resolver)`    |

## Resolver Signature

The biggest breaking change. v1 used `(req, res, ctx)` three-argument resolvers. v2 uses a single object argument and returns a `Response` directly.

```typescript
// BAD: v1 resolver
rest.get("/user", (req, res, ctx) => {
  return res(ctx.json({ name: "John" }));
});

// GOOD: v2 resolver
http.get("/user", ({ request, params, cookies }) => {
  return HttpResponse.json({ name: "John" });
});
```

### v2 resolver info object

| Property    | Type                                 | Description                                                                |
| ----------- | ------------------------------------ | -------------------------------------------------------------------------- |
| `request`   | `Request`                            | Standard Fetch API Request                                                 |
| `params`    | `Record<string, string \| string[]>` | Path parameters. Repeating params (`:segments+`) yield an array of strings |
| `cookies`   | `Record<string, string>`             | Parsed request cookies                                                     |
| `requestId` | `string`                             | Unique request identifier                                                  |

## Response Construction

Complete `ctx.*` to `HttpResponse.*` mapping:

| v1                                      | v2                                                |
| --------------------------------------- | ------------------------------------------------- |
| `res(ctx.json(data))`                   | `HttpResponse.json(data)`                         |
| `res(ctx.text(str))`                    | `HttpResponse.text(str)`                          |
| `res(ctx.xml(str))`                     | `HttpResponse.xml(str)`                           |
| `res(ctx.body(str))`                    | `new HttpResponse(str)`                           |
| `res(ctx.status(code))`                 | `new HttpResponse(null, { status: code })`        |
| `res(ctx.status(code), ctx.json(data))` | `HttpResponse.json(data, { status: code })`       |
| `res(ctx.set(name, val))`               | Include in `headers` init option                  |
| `res(ctx.cookie(name, val))`            | `headers: { 'Set-Cookie': 'name=val' }`           |
| `res(ctx.delay(ms), ctx.json(data))`    | `await delay(ms); return HttpResponse.json(data)` |
| `res.once(ctx.json(data))`              | `http.get(url, resolver, { once: true })`         |
| `res.networkError(msg)`                 | `HttpResponse.error()`                            |
| `res(ctx.data({ user }))`               | `HttpResponse.json({ data: { user } })`           |
| `res(ctx.errors([...]))`                | `HttpResponse.json({ errors: [...] })`            |

### Full before/after examples

#### JSON response with status

```typescript
// BAD: v1
rest.post("/api/user", (req, res, ctx) => {
  return res(ctx.status(201), ctx.json({ id: "1", name: "John" }));
});

// GOOD: v2
http.post("/api/user", () => {
  return HttpResponse.json({ id: "1", name: "John" }, { status: 201 });
});
```

#### Custom headers

```typescript
// BAD: v1
rest.get("/api/data", (req, res, ctx) => {
  return res(ctx.set("X-Request-Id", "123"), ctx.json({ value: 42 }));
});

// GOOD: v2
http.get("/api/data", () => {
  return HttpResponse.json(
    { value: 42 },
    { headers: { "X-Request-Id": "123" } },
  );
});
```

#### Delayed response

```typescript
// BAD: v1
rest.get("/api/user", (req, res, ctx) => {
  return res(ctx.delay(1000), ctx.json({ name: "John" }));
});

// GOOD: v2
import { delay } from "msw";

http.get("/api/user", async () => {
  await delay(1000);
  return HttpResponse.json({ name: "John" });
});
```

#### One-time response

```typescript
// BAD: v1
rest.get("/api/data", (req, res, ctx) => {
  return res.once(ctx.json({ first: true }));
});

// GOOD: v2
http.get(
  "/api/data",
  () => {
    return HttpResponse.json({ first: true });
  },
  { once: true },
);
```

#### Network error

```typescript
// BAD: v1
rest.get("/api/data", (req, res, ctx) => {
  return res.networkError("Failed to connect");
});

// GOOD: v2
http.get("/api/data", () => {
  return HttpResponse.error();
});
```

## Request Property Changes

| v1 (`req.*`)            | v2 (`request` / resolver info)         |
| ----------------------- | -------------------------------------- |
| `req.url`               | `new URL(request.url)`                 |
| `req.params`            | `params` (from resolver info)          |
| `req.cookies`           | `cookies` (from resolver info)         |
| `req.body`              | `await request.json()` (async!)        |
| `req.headers.get(name)` | `request.headers.get(name)` (same API) |

### Reading the request body is now async

```typescript
// BAD: v1 (sync body access)
rest.post("/api/user", (req, res, ctx) => {
  const { name } = req.body;
  return res(ctx.json({ name }));
});

// GOOD: v2 (async body access)
http.post("/api/user", async ({ request }) => {
  const { name } = await request.json();
  return HttpResponse.json({ name });
});
```

### Reading URL and query params

```typescript
// BAD: v1
rest.get("/api/posts", (req, res, ctx) => {
  const page = req.url.searchParams.get("page");
  return res(ctx.json({ page }));
});

// GOOD: v2
http.get("/api/posts", ({ request }) => {
  const url = new URL(request.url);
  const page = url.searchParams.get("page");
  return HttpResponse.json({ page });
});
```

## GraphQL Changes

```typescript
// BAD: v1
graphql.query("GetUser", (req, res, ctx) => {
  const { id } = req.variables;
  return res(ctx.data({ user: { id, name: "John" } }));
});

// GOOD: v2
graphql.query("GetUser", ({ variables }) => {
  const { id } = variables;
  return HttpResponse.json({
    data: { user: { id, name: "John" } },
  });
});
```

| v1                    | v2                                       |
| --------------------- | ---------------------------------------- |
| `req.variables`       | `variables` (from resolver info)         |
| `req.operationName`   | `operationName` (from resolver info)     |
| `ctx.data(data)`      | `HttpResponse.json({ data })`            |
| `ctx.errors(errors)`  | `HttpResponse.json({ errors })`          |
| `ctx.extensions(ext)` | `HttpResponse.json({ extensions: ext })` |

## Lifecycle Event Changes

```typescript
// BAD: v1
server.on("request:start", (req) => {
  console.log(req.url.href);
});

// GOOD: v2
server.events.on("request:start", ({ request, requestId }) => {
  console.log(request.url);
});
```

Key changes:

- Access events through `server.events` instead of `server` directly
- Event payload is a destructurable object instead of positional arguments
- `request` is a standard Fetch API `Request` object

## Removed APIs

| Removed API          | Replacement                                     |
| -------------------- | ----------------------------------------------- |
| `rest` namespace     | `http` namespace                                |
| `res()` function     | Return `HttpResponse` or `Response` directly    |
| `ctx.*` helpers      | `HttpResponse.*` static methods                 |
| `req.body` (sync)    | `await request.json()` (async)                  |
| `req.params`         | `params` from resolver info                     |
| `req.cookies`        | `cookies` from resolver info                    |
| `res.once()`         | `{ once: true }` handler option                 |
| `res.networkError()` | `HttpResponse.error()`                          |
| `ctx.fetch()`        | Use native `fetch()` with `bypass()` from `msw` |
| `req.passthrough()`  | `passthrough()` from `msw`                      |
| `printHandlers()`    | `listHandlers()`                                |

### printHandlers() to listHandlers()

```typescript
// BAD: v1
worker.printHandlers();

// GOOD: v2 — returns an array of handlers instead of logging them
console.log(worker.listHandlers());
```

### ctx.fetch() to bypass()

```typescript
// BAD: v1
rest.get("/api/user", async (req, res, ctx) => {
  const originalResponse = await ctx.fetch(req);
  const body = await originalResponse.json();
  return res(ctx.json({ ...body, extra: true }));
});

// GOOD: v2
import { bypass } from "msw";

http.get("/api/user", async ({ request }) => {
  const originalResponse = await fetch(bypass(request));
  const body = await originalResponse.json();
  return HttpResponse.json({ ...body, extra: true });
});
```
