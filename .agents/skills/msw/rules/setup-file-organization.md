---
title: Organize Mocks in `src/mocks/` with Separate Handler, Server, and Worker Files
impact: CRITICAL
description: Keep shared handlers in `handlers.ts`, server setup in `node.ts`, and worker setup in `browser.ts`. Avoid inline handlers in test files.
tags: setup, organization, handlers, node, browser, file-structure
---

# Organize Mocks in `src/mocks/`

## Problem

Developers define handlers inline in every test file, duplicating mock definitions and making it impossible to maintain consistent mock behavior across the test suite.

## Incorrect

```typescript
// test/user.test.ts — handlers defined inline
const server = setupServer(
  http.get("/api/user", () => HttpResponse.json({ name: "John" })),
  http.get("/api/posts", () => HttpResponse.json([])),
);

// test/posts.test.ts — same handlers duplicated
const server = setupServer(
  http.get("/api/user", () => HttpResponse.json({ name: "John" })),
  http.get("/api/posts", () => HttpResponse.json([{ id: 1 }])),
);
```

## Correct

```
src/mocks/
├── handlers.ts    # Shared happy-path handlers
├── node.ts        # Server setup for tests / SSR
└── browser.ts     # Worker setup for Storybook / dev
```

```typescript
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/user", () => {
    return HttpResponse.json({ name: "John" });
  }),
  http.get("/api/posts", () => {
    return HttpResponse.json([{ id: 1, title: "First Post" }]);
  }),
];

// src/mocks/node.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

Browser setup needs one extra step: the worker script must exist on disk before `worker.start()` will work.

```bash
npx msw init <PUBLIC_DIR> --save
```

This copies `mockServiceWorker.js` into your public directory — commit it, and verify it is served at `/mockServiceWorker.js`. The `--save` flag records `msw.workerDirectory` in `package.json`, so the script is copied again automatically whenever you install `msw`, keeping it in sync with the installed version.

```typescript
// src/mocks/browser.ts
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

// test/user.test.ts — uses shared server, overrides only what's needed
import { server } from "../src/mocks/node";

test("shows error state", () => {
  server.use(
    http.get("/api/user", () => new HttpResponse(null, { status: 500 })),
  );
  // ...
});
```

## Why

Centralizing handlers ensures consistent mock behavior across tests, Storybook, and development. The `handlers.ts` file defines happy-path defaults; individual tests use `server.use()` to override only the endpoints they need for error or edge-case scenarios. This eliminates duplication and makes updating API mocks a single-file change.
