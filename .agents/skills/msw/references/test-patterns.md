# Test Patterns Reference

## Table of Contents

- [Setup for Vitest](#setup-for-vitest)
- [Setup for Jest](#setup-for-jest)
- [Per-Test Overrides](#per-test-overrides)
- [Concurrent Test Isolation](#concurrent-test-isolation)
- [Handler Organization](#handler-organization)
- [Higher-Order Resolvers](#higher-order-resolvers)
- [Dynamic Mock Scenarios](#dynamic-mock-scenarios)
- [Cache Clearing for React Query / SWR / Apollo](#cache-clearing)
- [Conditional Browser Mocking](#conditional-browser-mocking)

## Setup for Vitest

```typescript
// vitest.setup.ts
import { beforeAll, afterEach, afterAll } from "vitest";
import { server } from "./src/mocks/node";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

## Setup for Jest

```typescript
// jest.setup.ts
import { server } from "./src/mocks/node";

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```javascript
// jest.config.js
// npm i -D jest-fixed-jsdom
module.exports = {
  setupFilesAfterEnv: ["./jest.setup.ts"],
  // jest-environment-jsdom intentionally replaces Node.js built-ins with
  // polyfills, which breaks MSW 2.x's Fetch primitives. jest-fixed-jsdom is a
  // superset of it with the built-in Node.js modules added back.
  testEnvironment: "jest-fixed-jsdom",
  testEnvironmentOptions: {
    // JSDOM defaults to the "browser" export condition, which breaks
    // `import { setupServer } from 'msw/node'`.
    customExportConditions: [""],
  },
};
```

Upstream describes the `jest-fixed-jsdom` environment as a workaround and recommends Vitest, which has none of the Node.js globals issues.

## Per-Test Overrides

Use `server.use()` to add handlers that only last until `resetHandlers()` runs in `afterEach`.

### Override for error state

```tsx
test("shows error when API fails", async () => {
  server.use(
    http.get("/api/user", () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  render(<UserProfile />);
  await waitFor(() => {
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
```

### Override for empty state

```tsx
test("shows empty state", async () => {
  server.use(http.get("/api/posts", () => HttpResponse.json([])));

  render(<PostList />);
  await waitFor(() => {
    expect(screen.getByText("No posts yet")).toBeInTheDocument();
  });
});
```

### Override for slow response (loading state)

```tsx
import { delay } from "msw/utils/delay";
import { http, HttpResponse } from "msw/http";

test("shows loading state", async () => {
  server.use(
    http.get("/api/user", async () => {
      await delay("infinite");
      return HttpResponse.json({ name: "John" });
    }),
  );

  render(<UserProfile />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
});
```

### One-time override for retry testing

```tsx
test("retries after failure", async () => {
  server.use(
    // First request fails, then handler is consumed
    http.get(
      "/api/data",
      () => {
        return new HttpResponse(null, { status: 500 });
      },
      { once: true },
    ),
  );
  // After one-time handler consumed, default handler responds with success

  render(<DataLoader />);
  await waitFor(() => {
    expect(screen.getByText("Data loaded")).toBeInTheDocument();
  });
});
```

## Concurrent Test Isolation

Use `server.boundary()` to prevent handler leakage between concurrent tests:

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

## Handler Organization

Recommended directory structure:

```
src/mocks/
├── handlers.ts          # Aggregates and exports all handlers
├── handlers/
│   ├── user.ts          # User-related handlers
│   ├── posts.ts         # Post-related handlers
│   └── auth.ts          # Auth-related handlers
├── node.ts              # setupServer(...handlers)
└── browser.ts           # setupWorker(...handlers)
```

### handlers/user.ts

```typescript
import { http, HttpResponse } from "msw/http";

export const userHandlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "John" },
      { id: "2", name: "Jane" },
    ]);
  }),

  http.get("/api/users/:id", ({ params }) => {
    return HttpResponse.json({ id: params.id, name: "John" });
  }),

  http.post("/api/users", async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(body, { status: 201 });
  }),
];
```

### handlers.ts

```typescript
import { userHandlers } from "./handlers/user";
import { postHandlers } from "./handlers/posts";
import { authHandlers } from "./handlers/auth";

export const handlers = [...authHandlers, ...userHandlers, ...postHandlers];
```

## Higher-Order Resolvers

Factory functions for reusable response patterns:

### Authentication wrapper

```typescript
import { http, HttpResponse, type HttpResponseResolver } from "msw/http";

function withAuth(resolver: HttpResponseResolver): HttpResponseResolver {
  return async (info) => {
    const token = info.request.headers.get("Authorization");
    if (!token) {
      return new HttpResponse(null, { status: 401 });
    }
    return resolver(info);
  };
}

// Usage
http.get(
  "/api/profile",
  withAuth(({ request }) => {
    return HttpResponse.json({ name: "John" });
  }),
);
```

### Paginated response wrapper

```typescript
function withPagination<T>(items: T[]): HttpResponseResolver {
  return ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? "1");
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const start = (page - 1) * limit;
    const paginatedItems = items.slice(start, start + limit);

    return HttpResponse.json({
      data: paginatedItems,
      total: items.length,
      page,
      totalPages: Math.ceil(items.length / limit),
    });
  };
}

http.get("/api/posts", withPagination(allPosts));
```

## Dynamic Mock Scenarios

Create scenario-specific handler sets for reuse across tests:

```typescript
function createUserHandlers(scenario: "happy" | "error" | "empty") {
  switch (scenario) {
    case "happy":
      return http.get("/api/user", () =>
        HttpResponse.json({ name: "John", email: "john@example.com" }),
      );
    case "error":
      return http.get(
        "/api/user",
        () => new HttpResponse(null, { status: 500 }),
      );
    case "empty":
      return http.get(
        "/api/user",
        () => new HttpResponse(null, { status: 404 }),
      );
  }
}

test("error scenario", async () => {
  server.use(createUserHandlers("error"));
  // ...
});
```

### Multi-endpoint scenario

```typescript
function createScenario(scenario: "authenticated" | "anonymous") {
  if (scenario === "authenticated") {
    return [
      http.get("/api/me", () => HttpResponse.json({ id: "1", name: "John" })),
      http.get("/api/settings", () => HttpResponse.json({ theme: "dark" })),
    ];
  }
  return [http.get("/api/me", () => new HttpResponse(null, { status: 401 }))];
}

test("authenticated dashboard", async () => {
  server.use(...createScenario("authenticated"));
  // ...
});
```

## Cache Clearing

### React Query

Create a fresh `QueryClient` per test to avoid stale cache:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}
```

### SWR

Use `SWRConfig` with a fresh cache per test:

```tsx
import { SWRConfig } from "swr";

function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
      {ui}
    </SWRConfig>,
  );
}
```

### Apollo Client

Create a fresh `InMemoryCache` per test:

```tsx
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { ApolloProvider } from "@apollo/client/react";

function renderWithApollo(ui: React.ReactElement) {
  const client = new ApolloClient({
    link: new HttpLink({ uri: "/graphql" }),
    cache: new InMemoryCache(),
  });
  return render(<ApolloProvider client={client}>{ui}</ApolloProvider>);
}
```

In Apollo Client 4, `ApolloProvider` is exported from `@apollo/client/react`, not from `@apollo/client`. The client takes an `HttpLink`: it ignores a `uri` option, and its queries then fail.

## Conditional Browser Mocking

Browser mocking requires the worker script on disk first — run `npx msw init <PUBLIC_DIR> --save` and commit the generated `mockServiceWorker.js` (see `rules/setup-file-organization.md`). Without it, `worker.start()` fails because the registration 404s.

Enable mocking only in development:

```tsx
// src/main.tsx
async function enableMocking() {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
  const { worker } = await import("./mocks/browser");
  return worker.start({ onUnhandledFrame: "bypass" });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
});
```

### In Storybook

```typescript
// .storybook/preview.ts
import { setupWorker } from "msw/browser";
import { mswLoader } from "msw-storybook-addon/csf3";
import { handlers } from "../src/mocks/handlers";

export default {
  loaders: [
    mswLoader(async () => {
      const worker = setupWorker(...handlers);
      await worker.start({ onUnhandledFrame: "bypass" });
      return worker;
    }),
  ],
};
```

msw-storybook-addon 3 has no `initialize()` export. In CSF 3.0, pass a setup function to `mswLoader` from `msw-storybook-addon/csf3`. The addon deprecates this CSF 3.0 loader API. With CSF Next, pass the same function to the default export: `definePreview({ addons: [addonMsw(setup)] })`. Handlers given to `setupWorker()` stay active when the addon resets handlers between stories. The addon README still passes `onUnhandledRequest`; msw 3 renamed that option to `onUnhandledFrame`.
