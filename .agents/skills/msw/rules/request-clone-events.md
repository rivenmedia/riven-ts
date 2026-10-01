---
title: Clone Request Before Reading Body in Lifecycle Events
impact: HIGH
description: In lifecycle event listeners, always clone the request before reading its body. Reading consumes the body stream, breaking downstream handlers.
tags: request, clone, events, body, stream
---

# Clone Request Before Reading Body in Lifecycle Events

## Problem

When you read `request.json()` in a lifecycle event handler like `request:start`, the body stream is consumed. The actual request handler then gets an empty body.

## Incorrect

```typescript
// BUG: reading body consumes the stream — handler gets empty body
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
