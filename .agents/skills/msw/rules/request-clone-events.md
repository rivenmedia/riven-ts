---
title: Clone Request Before Reading Body in Lifecycle Events
impact: HIGH
description: In lifecycle event listeners, always clone the request before reading its body. Reading consumes the body stream, breaking downstream handlers.
tags: request, clone, events, body, stream
---

# Clone Request Before Reading Body in Lifecycle Events

## Problem

When you read `request.json()` in a lifecycle event listener like `request:start`, the body stream is consumed. MSW can then no longer clone the request for the handler lookup: the lookup fails with `TypeError: unusable`, MSW logs "Encountered an unhandled exception during the handler lookup", and the client receives a 500 response instead of the mock.

## Incorrect

```typescript
// BUG: reading the body consumes the stream — the handler lookup fails and the client gets a 500
server.events.on("request:start", async ({ request }) => {
  const body = await request.json();
  console.log("Request body:", body);
});
```

## Correct

```typescript
server.events.on("request:start", async ({ request }) => {
  const clone = request.clone();
  const body = await clone.json();
  console.log("Request body:", body);
});
```

## Why

The Fetch API `Request` body is a `ReadableStream` — once read, it's consumed. Lifecycle events share the same `Request` object with handlers. Cloning creates an independent copy with its own body stream, so reading in the event listener doesn't interfere with handler resolution.
