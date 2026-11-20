# Changelog

## 1.2.3

Checked against **msw 3.0.3** on Node.js 26.12.1. Every code block now type-checks with TypeScript 5.9 in strict mode against msw 3.0.3 and the libraries it imports, or carries a marker that says why it must fail.

### Corrected — the skill taught something untrue

- **The Apollo example did not run on Apollo Client 4.** `references/test-patterns.md` imported `ApolloProvider` from `@apollo/client` and passed `uri` to `ApolloClient`. Executed on `@apollo/client` 4.3.6: the import is a `SyntaxError`, and the client ignores `uri`, so a query rejects with a `TypeError`. The example now imports `ApolloProvider` from `@apollo/client/react` and passes `link: new HttpLink({ uri })`.
- **The Storybook example used an export that msw-storybook-addon 3 does not have.** msw 3 needs the addon 3.x, because 2.0.7 has the peer range `msw ^2.0.0`. Executed on msw-storybook-addon 3.0.3 with Storybook 10.6.5: importing `initialize` is a `SyntaxError`. The root exports only the default `addonMsw`, and `msw-storybook-addon/csf3` exports `mswLoader`. The example now passes `mswLoader` a setup function that starts `setupWorker(...handlers)`. The note gives the CSF Next form and says that the addon deprecates the CSF 3.0 loader API.

### Changed

- 35 lines that show removed v1 or v2 API carry `// @ts-expect-error <reason>`, so the reader sees why the line fails on msw 3 (`AGENTS.md`, `references/anti-patterns.md`, both migration guides and six rules).
- Eight blocks that showed Incorrect and Correct code together, and declared the same name twice, are split into separate blocks.
- Signature pseudo-code in `references/handler-api.md` and `references/response-api.md` is fenced as `text`.
- `withAuth` and `withPagination` in `references/test-patterns.md` are typed with `HttpResponseResolver`, and the listener in `references/server-api.md` types its parameter, so the examples compile in strict mode.
- The v1-to-v2 GraphQL example says that msw 3 moved operations onto `graphql.link()`.

## 1.2.2

Checked against **msw 3.0.3** on Node.js 26.12.1, with the same handlers run on **msw 2.15.0** for comparison.

### Added — the v2-to-v3 migration guide missed two breaking changes

- **A repeating path parameter is one string in v3.** `/settings/:segments+` on `/settings/user/privacy` gives `['user', 'privacy']` on msw 2.15.0 and `'user/privacy'` on msw 3.0.3. The `PathParams` type still allows an array, so `params.segments.join('/')` type-checks and then throws. `references/migration-v2-to-v3.md` and the `SKILL.md` migration table now say so and give code that works on both versions.
- **RegExp tokens in a string predicate no longer match.** `'/user/:id(\\d+)'` matched `/user/123` on msw 2.15.0 and matches no request on msw 3.0.3. The migration guide, its checklist, the `SKILL.md` table and `references/handler-api.md` now point to a `RegExp` predicate.

Both changes come from the move to the `@msw/url` matcher in msw 3.0.0. The msw path-parameters docs page still shows arrays.

## 1.2.1

Checked against **msw 3.0.3** on Node.js 26. Every changed example was type-checked with TypeScript 5.9 in strict mode, and every changed behaviour claim was executed against msw 3.0.3.

### Corrected — the skill taught something untrue

- **The GraphQL response-shape rule used the removed namespace API.** The Correct example in `rules/graphql-response-shape.md` called `graphql.query()`, which v3 does not have. It now defines the operations on `graphql.link('/graphql')`. The `once` example in `references/handler-api.md` had the same defect.
- **The GraphQL scope rule described v2.** `rules/graphql-scope-with-link.md` showed `graphql.query()` as the unscoped case. In v3 every operation is on a link. The rule now shows that a wildcard or RegExp link (`'*'`, `'*/graphql'`, `/graphql$/`) answers the same operation on two endpoints, and that one exact link per API does not. Executed against two endpoints.
- **`matchRequestUrl` and `PathParams` are not exported from `msw/http`.** That entrypoint exports only `http`, `HttpResponse`, `HttpHandler` and `HttpMethods`. `references/handler-api.md` now imports both from `msw`. Executed: the custom predicate and the standalone call return `{ matches, params }`.
- **`frame.protocol === 'http'` does not narrow `frame.data`** (TS18046 in strict mode). The custom `onUnhandledFrame` examples now narrow with `frame instanceof HttpNetworkFrame` from `msw/experimental` (`references/server-api.md`, `references/migration-v2-to-v3.md`, `SKILL.md`). Executed: asset requests are skipped and other requests reach `defaults.warn()`.
- **The custom `onUnhandledFrame` callback takes one `{ frame, defaults }` object**, not `(request)` (`rules/test-unhandled-request.md`, `AGENTS.md`).
- **The import map sent every handler and utility to `'msw'`** (`rules/setup-import-paths.md`, `AGENTS.md`). It now gives the v3 subpaths.
- **Reading the body in `request:start` without `clone()` does not give the handler an empty body.** The handler lookup fails with `TypeError: unusable`, and the client receives a 500 response (`rules/request-clone-events.md`, `AGENTS.md`).
- **`onUnhandledFrame: 'error'` does not throw into the test.** It prints `[MSW] Error: intercepted a request without a matching request handler`, and the request rejects with `TypeError: fetch failed`. The default `'warn'` prints a warning; it is not silent (`rules/test-unhandled-request.md`, `references/server-api.md`, `references/anti-patterns.md`, `AGENTS.md`).
- **A native `Response` drops `Set-Cookie` only in the browser.** Node.js keeps the header, and the client receives it. `HttpResponse` stays the advice, because only it behaves the same in both environments (`rules/response-use-httpresponse.md`, `references/response-api.md`, `references/anti-patterns.md`, `SKILL.md`, `AGENTS.md`).
- **The network-error message depends on the runtime.** The skill gave "Failed to fetch" as the message; Node.js says "fetch failed", and browsers differ. The network-error rule now tells the reader to assert on the `TypeError`, not the message (`rules/response-error-network.md`, `references/response-api.md`, `AGENTS.md`).
- **A native `Response.error()` also gives a network error.** The comparison table in `references/response-api.md` said "Not possible". Executed: both reject with `TypeError: fetch failed`.
- **Repeating path parameters arrive as one string in msw 3.0.3.** `:path*` and `:segments+` give `'a/b/c.txt'`, not an array. The docs and the type allow an array, so the wildcard example accepts both forms; its old `[].concat()` did not type-check (`references/handler-api.md`, `rules/handler-resolver-v2.md`, `references/migration-v1-to-v2.md`, `AGENTS.md`).
- **The v2 requirements in the v2-to-v3 table** said Node.js 14 and TypeScript 4.4. The 1.x-to-2.x guide gives Node.js 18 and TypeScript 4.7, and msw 2.15.0 declares TypeScript >=4.8; the table now gives both. The v3 row adds the `engines` value of msw 3.0.3, `>=22.12.0`.
- **The `delay('real')` note cited msw 2.15.0 internals.** It now states the measured msw 3.0.3 behaviour.

### Added

- **The `graphql` peer dependency.** `msw/graphql` needs `graphql` >=16, an optional peer of msw. Without it the import fails with `Cannot find package 'graphql'`. In the migration guide, its checklist, the `SKILL.md` v3 note and `AGENTS.md`.
- **A leftover `onUnhandledRequest` is ignored.** TypeScript rejects it (TS2353). Plain JavaScript ignores it, so the default `'warn'` applies and unhandled requests reach the network. In the migration guide, its checklist and the `SKILL.md` migration table.
- **Root exports.** The migration guide states that the root `msw` module still re-exports most handlers and utilities, but not `graphql`, `setupServer` or `setupWorker`. The subpaths stay the advice.

### Changed

- The `AGENTS.md` title, the `SKILL.md` quick-reference heading and the `README.md` name v3, not v2.
- Release dates are removed from the skill text (`SKILL.md`, `AGENTS.md`, the migration guide).
- A duplicate rule heading in section 6 of `AGENTS.md` is removed.
- A body example in `references/migration-v1-to-v2.md` now type-checks.
- Examples that contain JSX are fenced as `tsx`, so a TypeScript check parses them (14 blocks in `AGENTS.md`, `references/test-patterns.md` and three rules).
- This file lists releases newest first.

## 1.2.0

Updated for **msw 3.0.0** (released 2026-09-28), audited against **msw 3.0.3**. Baseline raised from `^2.15.0` to `^3.0.0` in `SKILL.md`, `AGENTS.md` and `README.md`; `metadata.version` is now 1.2.0.

### Changed

- **v3 API renames applied across the skill**: `onUnhandledRequest` is now `onUnhandledFrame` in all setup and lifecycle examples; the `server.events` life-cycle `connection` event is now `websocket:connection` (the `ws` link's own `addEventListener('connection')` is unchanged); React Native guidance now uses the `@msw/react-native` package, since the `msw/native` entrypoint no longer exists.
- **Entrypoint restructure applied everywhere**: `http`/`HttpResponse` come from `msw/http`, `graphql` from `msw/graphql`, `ws` from `msw/ws`, `sse` from `msw/sse`, and utilities from per-module `msw/utils/*` paths (`delay`, `bypass`, `passthrough`, `is-common-asset-request`) — verified against the official migration guide at mswjs.io/docs/migrations/2.x-to-3.x.
- **GraphQL guidance is link-first**: v3 removes `graphql.query`/`mutation`/`operation` from the namespace; all examples define operations on `graphql.link(url)`, including the new `link.subscription()` for GraphQL subscriptions.
- **New requirements documented**: MSW v3 is ESM-only and requires Node.js >=22 and TypeScript >=5.9. The abstract and the IMPORTANT note in `SKILL.md` state both, so agents do not apply v2 patterns to a v3 runtime.
- **New `references/migration-v2-to-v3.md`**: the complete v2 to v3 migration — requirement table, every renamed/removed API (`handleRequest()` to `getResponse()`, with `defineNetwork()` as the experimental custom-network path, `GraphQLLinkHandlers` to `GraphQLLink`, `worker.stop()` now async, fake timers no longer patched, Node cookie behavior, `bypass()` dropping Content-Length), the new `msw/utils` entrypoint, Vite plugin, WebSocket Extension API, GraphQL v17 and subscriptions, and a nine-step migration checklist.
- **v2 to v3 quick-reference table in `SKILL.md`**, alongside the existing v1 to v2 table, so migration needs are answered in place without opening the reference.

## 1.1.0

Audited against **msw 2.15.0** (the current release) and against the official documentation at https://mswjs.io/docs. Every code example added or changed in this release was executed against msw 2.15.0 and type-checked with `tsc --strict` before being written down.

**Baseline raised from `^2.0.0` to `^2.15.0`.** A caret range resolves to the newest 2.x on every install, so the old baseline never protected a reader from behaviour the skill did not describe — it guaranteed they would meet it. `SKILL.md`, `AGENTS.md` and `README.md` now declare `^2.15.0`.

### Corrected

- **`delay('real')` gives no observable latency in Node.js either.** The behaviour table recommended `delay('real')` for "simulating real latency"; `'real'` explicitly sets the same realistic response time that Node.js cuts down, and in msw 2.15.0 both routes call the same internal helper — which returns a fixed few milliseconds under Node instead of the browser's random 100-400ms. The table now says so for both forms.
- **`URL` is not a valid handler predicate.** The `http.*` signature listed `URL`; the predicate is `string | RegExp` or a function. Absolute URLs are supported as strings.
- **`params` is `Record<string, string | string[]>`.** Repeating params (`:segments+`) yield an array. Corrected in `rules/handler-resolver-v2.md`, `AGENTS.md` and `references/migration-v1-to-v2.md`.
- **`matchRequestUrl` always returns an object.** The example guarded with `if (match)`, which is unconditionally true, and matched a relative pattern that never resolves outside a browser. It now checks `.matches` and matches against an absolute pattern.
- **GraphQL `query` is not a `DocumentNode`.** The resolver-info comment claimed a parsed AST; it is described upstream as the GraphQL query sent from the client, and reading `.definitions` off it yields `undefined`.
- **`worker.stop()` does not unregister the service worker.** It disables mocking for the current client only, and the stopped state does not survive a page reload.
- **Throwing an `Error` in a resolver is not a network failure.** The old text said it "crashes the handler". MSW handles it as an unhandled resolver exception and emits the `unhandledException` life-cycle event; the client does not see a network error. `HttpResponse.error()` remains the correct tool.
- **The query-parameter rule summary in `SKILL.md`** still said predicates with query params "silently match nothing" — the opposite of what happens, and out of step with the already-corrected rule file.

### Added

- **`sse()` for Server-Sent Events.** `rules/response-streaming.md` is now a split rule: `sse()` for Server-Sent Events, `ReadableStream` for non-SSE chunked transfer. The hand-rolled `text/event-stream` recipe is demoted to a second-best variant, and the chunked example no longer carries SSE headers.
- **WebSocket coverage (`ws`).** `references/handler-api.md` and `AGENTS.md` document `ws.link()`, the `connection` event, client/server members and broadcasting. The skill previously implied MSW could not mock WebSockets.
- **`finalize`.** Documented on the resolver-info tables and in a dedicated section: LIFO ordering, runs even when the resolver throws, cannot be awaited.
- **Custom predicate functions.** The predicate receives `request` and `cookies`; a boolean predicate loses path-parameter parsing, so the extended `{ matches, params }` result with `matchRequestUrl()` is documented alongside it. Cross-linked from anti-pattern #2.
- **`isCommonAssetRequest`.** A custom `onUnhandledFrame` callback opts out of MSW's built-in common-asset exemption; the custom-strategy example now re-applies it.
- **`npx msw init <PUBLIC_DIR> --save`.** Browser setup previously produced a `worker.start()` that 404s, because the skill never mentioned generating `mockServiceWorker.js`.
- **`@msw/react-native` for React Native**, added to the import maps.
- **A working Jest recipe.** `jest-environment-jsdom` breaks MSW 2.x's Fetch primitives; the config now uses `jest-fixed-jsdom` and `testEnvironmentOptions.customExportConditions`.
- **Environment requirements in the migration guide** — Node.js 18.0.0, TypeScript 4.7 — plus `printHandlers()` → `listHandlers()` and `req.passthrough()` → `passthrough()` in the Removed APIs table.
- **GraphQL handler options and non-string predicates** — `RegExp`, `DocumentNode`/`TypedDocumentNode`, and `{ once: true }`.
- **`Content-Length`** is auto-set by `HttpResponse.arrayBuffer()` from the buffer's byte length.
- **The `HttpResponse` constructor body union** now lists `TypedArray`, `DataView`, `URLSearchParams` and `undefined`.
- **Throwing a `Response` is supported** and is not the anti-pattern — it short-circuits the resolver and is used as the mocked response. Anti-pattern #10 is retitled accordingly.
- **Handler-side request validation and the one-way-request exception** to "don't assert on requests", both of which upstream documents.

### Not changed, deliberately

- `HttpResponse.arrayBuffer()` — the skill lists no default `Content-Type` for it, which is what the documentation states. The shipped implementation sets `application/octet-stream`, but observed behaviour alone is not a basis for a documented claim.
- `HttpResponse.xml()` — the skill lists `text/xml`, which is what the implementation produces; the documentation says `application/xml`. Left as is.
- The bare-wildcard example (`http.get('/files/*')`) still uses the named `:path*` form. The key for an unnamed group is not documented.
- The `sse()` passthrough form (`server.connect()`) is not documented in this skill: it could not be verified in the audit environment, and unverified examples are not published.
