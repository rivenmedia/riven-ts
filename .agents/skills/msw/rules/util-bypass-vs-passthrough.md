---
title: Understand `bypass()` vs `passthrough()` — They Are Not Interchangeable
impact: MEDIUM
description: "`bypass()` creates a new supplementary request; `passthrough()` passes the intercepted one through as-is."
tags: utility, bypass, passthrough, conditional, proxy
---

# `bypass()` vs `passthrough()`

## Problem

Developers confuse `bypass()` and `passthrough()`. They serve completely different purposes.

## Incorrect

```typescript
// BUG: bypass() creates a NEW request — it doesn't "let this request through"
import { bypass } from "msw";

http.get("/api/user", ({ request }) => {
  // Wrong: this makes a SECOND request, not passing the original through
  return bypass(request);
});
```

## Correct

```typescript
import { bypass, passthrough } from "msw";

// passthrough() — let the original intercepted request go to the actual server
http.get("/api/feature-flag", ({ request }) => {
  if (process.env.USE_REAL_FLAGS) {
    return passthrough();
  }
  return HttpResponse.json({ enabled: true });
});

// bypass() — make an ADDITIONAL request that won't be intercepted
http.get("/api/user", async ({ request }) => {
  // Fetch the real response, then modify it
  const realResponse = await fetch(bypass(request));
  const realData = await realResponse.json();

  return HttpResponse.json({
    ...realData,
    mockedField: "extra-data",
  });
});
```

## Decision Table

| Function          | Creates new request? | Original request continues? | Use case                     |
| ----------------- | -------------------- | --------------------------- | ---------------------------- |
| `passthrough()`   | No                   | Yes — goes to real server   | Conditional mocking          |
| `bypass(request)` | Yes — supplementary  | No — you handle response    | Response patching / proxying |

## Why

`passthrough()` is for conditional mocking — "sometimes mock, sometimes real." `bypass()` is for response augmentation — "fetch the real data, then modify it before returning." Using them incorrectly leads to infinite request loops or unintended network calls.
