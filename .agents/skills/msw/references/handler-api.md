# Handler API Reference

## Table of Contents

- [HTTP Handlers](#http-handlers)
- [GraphQL Handlers](#graphql-handlers)
- [URL Predicates](#url-predicates)
- [Path Parameters](#path-parameters)
- [Handler Options](#handler-options)
- [matchRequestUrl Utility](#matchrequesturl-utility)
- [Resolver Cleanup with `finalize`](#resolver-cleanup-with-finalize)
- [WebSocket Handlers](#websocket-handlers)
- [Server-Sent Events Handlers](#server-sent-events-handlers)

## HTTP Handlers

All methods on the `http` namespace:

| Method                                        | Description      |
| --------------------------------------------- | ---------------- |
| `http.get(predicate, resolver, options?)`     | GET requests     |
| `http.post(predicate, resolver, options?)`    | POST requests    |
| `http.put(predicate, resolver, options?)`     | PUT requests     |
| `http.patch(predicate, resolver, options?)`   | PATCH requests   |
| `http.delete(predicate, resolver, options?)`  | DELETE requests  |
| `http.head(predicate, resolver, options?)`    | HEAD requests    |
| `http.options(predicate, resolver, options?)` | OPTIONS requests |
| `http.all(predicate, resolver, options?)`     | Any HTTP method  |

### Signature

```typescript
http.get(
  predicate:
    | string
    | RegExp
    | ((args: { request: Request; cookies: Record<string, string> }) =>
        | boolean
        | { matches: boolean; params: Record<string, string | string[]> }),
  resolver: (info: {
    request: Request
    params: Record<string, string | string[]>
    cookies: Record<string, string>
    requestId: string
    finalize: (callback: () => void | Promise<void>) => void
  }) => Response | HttpResponse | undefined | void | Promise<...>,
  options?: { once?: boolean }
)
```

The predicate is a `string`, a `RegExp`, or a function — **not** a `URL` instance. Absolute URLs are supported, but as strings: `http.get('https://api.example.com/user', resolver)`. Passing `new URL(...)` is not a supported predicate type and throws when the handler is constructed.

## GraphQL Handlers

| Method                                            | Description                            |
| ------------------------------------------------- | -------------------------------------- |
| `graphql.query(predicate, resolver, options?)`    | GraphQL queries                        |
| `graphql.mutation(predicate, resolver, options?)` | GraphQL mutations                      |
| `graphql.operation(resolver)`                     | Any GraphQL operation                  |
| `graphql.link(url)`                               | Scoped namespace for specific endpoint |

### Signature

```typescript
graphql.query<Query, Variables>(
  predicate: string | RegExp | DocumentNode | TypedDocumentNode,
  resolver: (info: {
    query
    variables
    operationName
    request
    cookies
    requestId
    finalize
  }) => ...,
  options?: { once?: boolean }
)
```

### GraphQL predicates

```typescript
// Operation name — exact match
graphql.query("GetUser", resolver);

// RegExp — tested against the operation name
graphql.mutation(/user/i, resolver); // matches CreateUser and UpdateUser

// DocumentNode / TypedDocumentNode — from gql`...` or codegen
graphql.query(GetUserDocument, resolver);
```

### GraphQL Resolver Info

```typescript
graphql.query(
  "GetUser",
  ({
    query, // the GraphQL query sent from the client
    variables, // Record<string, any> — query variables
    operationName, // string — operation name
    request, // Request — standard Fetch API Request
    cookies, // Record<string, string>
    requestId, // string
    finalize, // (callback) => void — schedule cleanup after the resolver completes
  }) => {
    return HttpResponse.json({ data: { user: { id: variables.id } } });
  },
);
```

## URL Predicates

### String — Exact pathname match

```typescript
http.get("/api/user", resolver);
```

### String with params — Captures path parameters

```typescript
http.get("/api/user/:id", resolver);
```

### Wildcard — Matches path prefix

```typescript
http.get("/api/*", resolver); // matches /api/anything
```

### Absolute URL — Full URL match

```typescript
http.get("https://api.example.com/user", resolver);
```

### RegExp — Pattern matching

```typescript
http.get(/\/api\/user\/\d+/, resolver);
```

### Custom function — Programmatic matching

The predicate function receives `request` and `cookies`, and returns a boolean:

```typescript
http.get(({ request, cookies }) => {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api") && url.searchParams.has("v");
}, resolver);
```

A boolean predicate does no path matching, so `params` in the resolver is always `{}`. To keep path-parameter parsing, return the extended result instead — an object of the shape `{ matches: boolean, params: Record<string, string | string[]> }` — and parse the params yourself with `matchRequestUrl()`:

```typescript
import { http, matchRequestUrl, HttpResponse, type PathParams } from "msw";

http.get<PathParams>(
  ({ request }) => {
    const url = new URL(request.url);

    return {
      matches: url.searchParams.has("mock"),
      // `.params` is required — matchRequestUrl returns { matches, params }.
      params:
        matchRequestUrl(url, "https://api.example.com/user/:id").params ?? {},
    };
  },
  ({ params }) => HttpResponse.json({ id: params.id }),
);
```

## Path Parameters

### Single parameter

```typescript
http.get("/user/:id", ({ params }) => {
  const { id } = params; // string
  return HttpResponse.json({ id });
});
```

### Multiple parameters

```typescript
http.get("/user/:userId/post/:postId", ({ params }) => {
  const { userId, postId } = params;
  return HttpResponse.json({ userId, postId });
});
```

### Wildcard parameter

A bare `*` is an _unnamed_ group, so there is no `params['*']` — reading it gives
`undefined`. Name the parameter instead, which is both readable and stable:

```typescript
http.get("/files/:path*", ({ params }) => {
  // params.path is an array of segments: ['a', 'b', 'c.txt']
  const path = [].concat(params.path).join("/");
  return HttpResponse.json({ path });
});
```

## Handler Options

### One-time handler

Automatically removed after the first matching request:

```typescript
http.get("/api/data", resolver, { once: true });
graphql.query("GetUser", resolver, { once: true });
```

Useful for testing retry logic — first request fails, second succeeds:

```typescript
server.use(
  http.get("/api/data", () => new HttpResponse(null, { status: 500 }), {
    once: true,
  }),
);
// First request → 500 (one-time handler consumed)
// Second request → default handler responds
```

## matchRequestUrl Utility

Matches a URL against a path pattern and extracts path parameters. Its main use is inside a custom predicate function (see above), where MSW does not parse path parameters for you; it also works standalone.

```typescript
import { matchRequestUrl } from "msw";

// Always returns an object — check `.matches`, never the object itself.
// A relative pattern is resolved against the document location, so outside a
// browser context match against an absolute pattern.
const match = matchRequestUrl(
  new URL("https://example.com/user/abc-123"),
  "https://example.com/user/:id",
);

if (match.matches) {
  console.log(match.params?.id); // 'abc-123'
}
```

A non-match returns `{ matches: false, params: {} }` — still a truthy object, so `if (match)` is unconditionally true.

## Resolver Cleanup with `finalize`

`finalize` is part of the resolver info on every namespace — `http.*`, `graphql.*`, `sse` and `ws`. It schedules cleanup to run after the request handler completes, which is what you need for side effects a resolver starts but does not own, such as intervals and timeouts on a stream:

```typescript
import { sse } from "msw";

sse("/ping", ({ client, finalize }) => {
  const interval = setInterval(() => client.send({ data: "pong" }), 250);
  const timeout = setTimeout(() => client.close(), 1000);

  finalize(() => {
    clearInterval(interval);
    clearTimeout(timeout);
  });
});
```

Points to remember:

- The signature is `finalize(callback: () => Promise<void> | void): void`.
- It has no effect on the surrounding resolver's closure. You cannot await it, and it must not become a dependency of any of your request handler logic.
- Multiple `finalize()` calls run LIFO — the last registered callback runs first.
- Callbacks run even if the response resolver throws. Unhandled exceptions in them are collected into an `AggregateError` reported after all callbacks complete.

## WebSocket Handlers

`ws.link(url: string | URL | RegExp)` creates a link to a WebSocket endpoint. The `connection` event fires whenever a client opens a matching connection:

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

| Member                                | Description                                                           |
| ------------------------------------- | --------------------------------------------------------------------- |
| `client.send(data)`                   | Send `string`, `Blob` or `ArrayBuffer` to the client                  |
| `client.close(code?, reason?)`        | Close the client connection                                           |
| `client.addEventListener(event, cb)`  | Listen for `message`, `error`, `close`                                |
| `link.clients`                        | `Set` of all active client connections                                |
| `link.broadcast(data)`                | Send to every connected client                                        |
| `link.broadcastExcept(clients, data)` | Send to every client except those given                               |
| `server.connect()`                    | Connect to the actual server; without it the handler _is_ the server  |
| `server.send(data)`                   | Send data to the actual server                                        |
| `server.addEventListener(event, cb)`  | Listen for `open`, `message`, `error`, `close` on the real connection |

## Server-Sent Events Handlers

`sse(predicate, resolver)` intercepts `EventSource` connections. The resolver receives `client` (the intercepted `EventSource`) alongside the usual resolver info:

```typescript
import { sse } from "msw";

export const handlers = [
  sse<{ greeting: string }>("/api/events", ({ client }) => {
    client.send({ id: "abc-123", event: "greeting", data: "Hello, John!" });
    client.close();
  }),
];
```

| Member                               | Description                                     |
| ------------------------------------ | ----------------------------------------------- |
| `client.send({ id?, event?, data })` | Send an event to the client                     |
| `client.error()`                     | Error the underlying HTTP connection            |
| `client.close()`                     | Gracefully close the underlying HTTP connection |
| `server.connect()`                   | Returns an `EventSource` to the actual server   |

Once connected via `server.connect()`, all server events are forwarded to the client by default; call `event.preventDefault()` on a server event to stop it being forwarded.

See `rules/response-streaming.md` for when to use `sse()` versus a `ReadableStream` body.
