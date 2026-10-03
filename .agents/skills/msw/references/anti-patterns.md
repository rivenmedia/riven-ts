# MSW Anti-Patterns

## Table of Contents

1. [Using v1 `rest` namespace](#1-using-v1-rest-namespace)
2. [Putting query params in URL predicates](#2-putting-query-params-in-url-predicates)
3. [Importing setupServer from wrong path](#3-importing-setupserver-from-wrong-path)
4. [Missing afterEach(resetHandlers)](#4-missing-aftereachresethandlers)
5. [Asserting on fetch calls](#5-asserting-on-fetch-calls)
6. [Not awaiting request.json()](#6-not-awaiting-requestjson)
7. [Using native Response for cookies](#7-using-native-response-for-cookies)
8. [Not using server.boundary() for concurrent tests](#8-not-using-serverboundary-for-concurrent-tests)
9. [Not setting onUnhandledRequest: 'error'](#9-not-setting-onunhandledrequest-error)
10. [Throwing an Error to simulate a network failure](#10-throwing-an-error-to-simulate-a-network-failure)

## 1. Using v1 `rest` namespace

```typescript
// BAD
import { rest } from "msw";
rest.get("/api/user", (req, res, ctx) => res(ctx.json({ name: "John" })));

// GOOD
import { http, HttpResponse } from "msw";
http.get("/api/user", () => HttpResponse.json({ name: "John" }));
```

## 2. Putting query params in URL predicates

```typescript
// BAD: '?id=1' is stripped — this is just http.get('/post') and serves every /post request
http.get("/post?id=1", resolver);

// GOOD: read query params inside resolver
http.get("/post", ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  return HttpResponse.json({ id });
});
```

The GOOD block above is the right default, but it still matches every `/post` request. To scope the handler so that requests without the param fall through to other handlers, use a function predicate:

```typescript
// ALSO GOOD: scope the handler to requests carrying the param,
// so requests without it fall through to other handlers
http.get(
  ({ request }) => new URL(request.url).searchParams.get("id") === "1",
  () => HttpResponse.json({ id: 1, title: "First Post" }),
);
```

See also upstream's `withSearchParams` higher-order resolver, which calls `passthrough()` when the predicate fails: https://mswjs.io/docs/best-practices/custom-request-predicate

## 3. Importing setupServer from wrong path

```typescript
// BAD
import { setupServer } from "msw";

// GOOD
import { setupServer } from "msw/node";
```

## 4. Missing afterEach(resetHandlers)

```typescript
// BAD: handlers leak between tests
beforeAll(() => server.listen());
afterAll(() => server.close());

// GOOD: reset after each test
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## 5. Asserting on fetch calls

```typescript
// BAD: tests implementation, not behavior
expect(fetch).toHaveBeenCalledWith(
  "/api/login",
  expect.objectContaining({
    method: "POST",
  }),
);

// GOOD: tests what the user sees
await waitFor(() => {
  expect(screen.getByText("Welcome!")).toBeInTheDocument();
});
```

```typescript
// ALSO GOOD: validate the request inside the handler
http.post("/login", async ({ request }) => {
  const data = await request.formData();
  const email = data.get("email");

  if (!email) {
    return new HttpResponse("Missing email", { status: 400 });
  }
});
```

Upstream's rationale: "Not only is this the right way to assert the request's validity, error handling also brings your request handlers closer to the production behavior."

**Exception:** some requests leave no observable trace in the application — typically one-way calls to third-party services such as analytics or monitoring. For those, use the life-cycle events API (`server.events.on('request:start', ...)`, see `references/server-api.md`) to assert on requests directly.

## 6. Not awaiting request.json()

```typescript
// BAD: body is a ReadableStream, not parsed data
http.post("/api/user", ({ request }) => {
  const body = request.body;
  return HttpResponse.json({ received: body });
});

// GOOD: await the async method
http.post("/api/user", async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ received: body });
});
```

## 7. Using native Response for cookies

```typescript
// BAD: Set-Cookie silently dropped
new Response(null, {
  headers: { "Set-Cookie": "token=abc" },
});

// GOOD: HttpResponse supports Set-Cookie
new HttpResponse(null, {
  headers: { "Set-Cookie": "token=abc" },
});
```

## 8. Not using server.boundary() for concurrent tests

```typescript
// BAD: overrides leak across concurrent tests
it.concurrent("test A", async () => {
  server.use(http.get("/api/user", () => HttpResponse.json({ role: "admin" })));
});

// GOOD: boundary isolates overrides
it.concurrent(
  "test A",
  server.boundary(async () => {
    server.use(
      http.get("/api/user", () => HttpResponse.json({ role: "admin" })),
    );
  }),
);
```

## 9. Not setting onUnhandledRequest: 'error'

```typescript
// BAD: unhandled requests silently pass through
server.listen();

// GOOD: missing handlers fail the test
server.listen({ onUnhandledRequest: "error" });
```

## 10. Throwing an Error to simulate a network failure

```typescript
// BAD: MSW handles this as an unhandled resolver exception, not a network error
http.get("/api/data", () => {
  throw new Error("Network failure");
});

// GOOD: simulates actual network error
http.get("/api/data", () => {
  return HttpResponse.error();
});
```

Note: throwing a `Response`/`HttpResponse` is a separate, supported feature — it short-circuits the resolver and is used as the mocked response. Only non-`Response` throws are the anti-pattern.
