# Changelog

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
- **`isCommonAssetRequest`.** A custom `onUnhandledRequest` callback opts out of MSW's built-in common-asset exemption; the custom-strategy example now re-applies it.
- **`npx msw init <PUBLIC_DIR> --save`.** Browser setup previously produced a `worker.start()` that 404s, because the skill never mentioned generating `mockServiceWorker.js`.
- **`msw/native` for React Native**, added to the import maps.
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
