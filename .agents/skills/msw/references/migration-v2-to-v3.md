# MSW v2 to v3 Migration Guide

MSW 3.0 (checked against 3.0.3) restructures the package entrypoints, makes GraphQL mocking link-first, and unifies the handling of unhandled requests and WebSocket connections. Official guide: https://mswjs.io/docs/migrations/2.x-to-3.x — MSW also ships **codemods** for the migration (see the official guide's "Codemods" link).

## Requirements

| Requirement   | v2                                  | v3                                                                                  |
| ------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| Module format | CJS + ESM                           | **ESM only**                                                                        |
| Node.js       | v18+                                | **v22+** (v24 and v26 also supported; msw 3.0.3's `engines` field says `>=22.12.0`) |
| TypeScript    | v4.7+ (msw 2.15.0 declares `>=4.8`) | **v5.9+** (v6.0 and v7.0 also supported)                                            |

If your project still needs CommonJS, Node.js <22, or TypeScript <5.9, stay on `msw@2` (`^2.15.0`) until you can upgrade the toolchain.

## Imports — everything moves to subpaths

Request handlers, event handlers, and utilities are now exported from designated entrypoints instead of the package root. In msw 3.0.3 the root `msw` module still re-exports most of them (`http`, `HttpResponse`, `ws`, `sse`, `delay`, `bypass`, `passthrough`, `isCommonAssetRequest`), but not `graphql`, `setupServer` or `setupWorker`. Follow the subpaths: an import of `graphql` from `msw` breaks.

Before (v2):

```typescript
// @ts-expect-error msw 3 does not export graphql from the root; import it from 'msw/graphql'
import {
  http,
  HttpResponse,
  graphql,
  ws,
  sse,
  delay,
  bypass,
  passthrough,
} from "msw";
```

After (v3):

```typescript
import { http, HttpResponse } from "msw/http";
import { graphql } from "msw/graphql";
import { ws } from "msw/ws";
import { sse } from "msw/sse";
import { delay } from "msw/utils/delay";
import { bypass } from "msw/utils/bypass";
import { passthrough } from "msw/utils/passthrough";
```

| Export                 | 2.x   | 3.x                                 |
| ---------------------- | ----- | ----------------------------------- |
| `http`, `HttpResponse` | `msw` | `msw/http`                          |
| `graphql`              | `msw` | `msw/graphql`                       |
| `ws`                   | `msw` | `msw/ws`                            |
| `sse`                  | `msw` | `msw/sse`                           |
| `delay`                | `msw` | `msw/utils/delay`                   |
| `bypass`               | `msw` | `msw/utils/bypass`                  |
| `passthrough`          | `msw` | `msw/utils/passthrough`             |
| `isCommonAssetRequest` | `msw` | `msw/utils/is-common-asset-request` |

`setupWorker` and `setupServer` stay at `msw/browser` and `msw/node`. React Native moves from the removed `msw/native` entrypoint to the `@msw/react-native` package.

## GraphQL is link-first

`graphql.query()`, `graphql.mutation()` and `graphql.operation()` are removed from the namespace. Create a link per endpoint and define operations on it:

```typescript
// v2
// @ts-expect-error msw 3 does not export graphql from the root; import it from 'msw/graphql'
import { graphql, HttpResponse } from "msw";

export const handlers = [
  graphql.query("GetUser", () =>
    HttpResponse.json({ data: { user: { name: "John" } } }),
  ),
];
```

```typescript
// v3
import { HttpResponse } from "msw/http";
import { graphql } from "msw/graphql";

const api = graphql.link("https://api.example.com/graphql");

export const handlers = [
  api.query("GetUser", () =>
    HttpResponse.json({ data: { user: { name: "John" } } }),
  ),
];
```

Links accept relative or absolute URLs, wildcards, and regular expressions. New in v3: `api.subscription()` for GraphQL subscriptions — the resolver receives a `subscription` object with `publish()`.

`msw/graphql` needs the `graphql` package (>=16), now an optional peer dependency of msw. Install it, or the import fails with `Cannot find package 'graphql'`.

## `onUnhandledRequest` → `onUnhandledFrame`

The option on `worker.start()` and `server.listen()` is renamed because it now covers any unhandled **network frame** — requests and WebSocket connections alike:

```typescript
// v3
server.listen({ onUnhandledFrame: "error" });
```

The old name is not an alias. TypeScript rejects `onUnhandledRequest` (TS2353); plain JavaScript ignores it, so the default `'warn'` applies and unhandled requests reach the network without failing anything.

The custom callback shape changed too: it receives a single `{ frame, defaults }` object instead of `(request, print)`. Narrow with `frame instanceof HttpNetworkFrame` (from `msw/experimental`) before reading data — a `frame.protocol` check does not narrow the type — and call a method on `defaults` to fall back to a built-in strategy:

```typescript
import { HttpNetworkFrame } from "msw/experimental";

server.listen({
  onUnhandledFrame({ frame, defaults }) {
    if (
      frame instanceof HttpNetworkFrame &&
      frame.data.request.url.includes("cdn.com")
    )
      return;
    defaults.warn();
  },
});
```

## Life-cycle events

The `connection` life-cycle event on `server.events` / `worker.events` is renamed:

```typescript
// v2
// @ts-expect-error msw 3 renamed the 'connection' event to 'websocket:connection'
server.events.on("connection", listener);

// v3
server.events.on("websocket:connection", listener);
```

Note: this rename applies to the **life-cycle events API only**. The WebSocket link's own listener — `chat.addEventListener('connection', ...)` — keeps the name `connection`.

The `LifeCycleEventsMap` type is no longer exported from `msw`. Events are described by two per-protocol maps exported from `msw/experimental`:

- `HttpNetworkFrameEventMap` — `request:*`, `response:*`, `unhandledException`
- `WebSocketNetworkFrameEventMap` — `websocket:connection`, `websocket:error`, `graphql:subscription`

Map values changed shape: each key now maps to an event class whose data (`request`, `requestId`, `response`…) is exposed as instance properties. Listeners that destructure those properties keep working unchanged.

## `worker.stop()` returns a Promise

```typescript
// v3 — resolves once interception is disabled for the current client
await worker.stop();
```

## `handleRequest()` removed

`handleRequest()` is no longer exported. For the common case, use the simpler `getResponse()`, which accepts handlers and a request and resolves to a mocked response:

```typescript
// v3
import { getResponse } from "msw";

const response = await getResponse(handlers, request);
```

If you used `handleRequest` to build a custom interception layer, look at the experimental `defineNetwork()` API instead.

## Path matching moved to `@msw/url`

msw 3.0.0 replaced `path-to-regexp` with its own matcher, `@msw/url`. Two results of this change are
not in the msw migration guide. Both were measured with the same handlers on msw 2.15.0 and msw 3.0.3.

**A repeating path parameter is one string, not an array.**

| Handler                | Request                  | v2 `params`                         | v3 `params`                    |
| ---------------------- | ------------------------ | ----------------------------------- | ------------------------------ |
| `/settings/:segments+` | `/settings/user/privacy` | `{ segments: ['user', 'privacy'] }` | `{ segments: 'user/privacy' }` |
| `/files/:path*`        | `/files/a/b/c.txt`       | `{ path: ['a', 'b', 'c.txt'] }`     | `{ path: 'a/b/c.txt' }`        |

The `PathParams` type still allows `ReadonlyArray<string>`, so TypeScript does not report v2 code
such as `params.segments.join('/')`. On v3 that call throws a `TypeError` at runtime. The msw docs
page on path parameters still shows arrays. Code that must run on both versions:

```typescript
import { http, HttpResponse } from "msw/http";

http.get("/settings/:segments+", ({ params }) => {
  const segments = [params.segments ?? []].flat().join("/"); // 'user/privacy' on v2 and v3
  return HttpResponse.json({ segments });
});
```

**RegExp tokens inside a string predicate do not match.** In v2, `'/user/:id(\\d+)'` matched
`/user/123`. In v3 the same handler matches no request, and the request goes to the unhandled-request
strategy. Use a `RegExp` predicate. Its capture groups arrive by index:

```typescript
import { http, HttpResponse } from "msw/http";

http.get(/\/user\/(\d+)$/, ({ params }) => {
  return HttpResponse.json({ id: params["0"] }); // '123' for /user/123
});
```

## Additional behavior changes (from the release notes)

- Cookies are no longer managed in Node.js; your environment's default applies (browser unaffected). `request.headers.get('cookie')` returns null in handlers — use the `cookies` resolver argument.
- MSW no longer patches `setTimeout` to circumvent fake timers — advance fake timers explicitly.
- `file://` requests and HTTP-to-WebSocket upgrades via `fetch()` throw in Node.js.
- `bypass()` removes the `Content-Length` request header.

## New in v3

- **Vite plugin** at `msw/vite` — serves the worker script for you (no more copying `mockServiceWorker.js` into public) and exposes a preconfigured network via the `virtual:msw` module:

```typescript
import { defineConfig } from "vite";
import { msw } from "msw/vite";

export default defineConfig({ plugins: [msw()] });
```

- **GraphQL v17** support and **GraphQL subscriptions**.
- **WebSocket Extension API** for custom experiences, plus the `websocket:error` life-cycle event.
- **Page-navigation and form-submission interception.**
- **Passthrough request-header modification.**
- Node.js v24 and v26 support; TypeScript v6 and v7 support.

## Migration checklist

1. Confirm your runtime: ESM-only project, Node.js >=22, TypeScript >=5.9.
2. Move imports to the subpath entrypoints (`msw/http`, `msw/graphql`, `msw/ws`, `msw/sse`, `msw/utils/*`). Consider the official codemods.
3. React Native: switch `msw/native` imports to `@msw/react-native`.
4. GraphQL: install the `graphql` package, and convert namespace-level `graphql.query/mutation/operation` calls to link-first (`graphql.link(url)` + `link.query(...)`).
5. Rename every `onUnhandledRequest` to `onUnhandledFrame` (JavaScript ignores the old name without a warning); update custom callbacks to the `{ frame, defaults }` shape.
6. Rename the life-cycle `connection` event to `websocket:connection` (the `ws` link's own `addEventListener('connection')` stays as-is).
7. Replace `handleRequest()` with `getResponse()` (or experimental `defineNetwork()` for custom networks).
8. Replace `LifeCycleEventsMap` imports with the per-protocol maps from `msw/experimental`.
9. `await worker.stop()` where shutdown ordering matters.
10. If you relied on MSW handling fake timers or cookie headers in Node, make both explicit in tests.
11. Search for repeating path parameters (`:name+`, `:name*`) and treat their value as a string. Replace RegExp tokens in string predicates (`:id(\\d+)`) with a `RegExp` predicate.
