---
title: Use `sse()` for Server-Sent Events, ReadableStream for Chunked
impact: HIGH
description: Mock Server-Sent Events with the `sse()` handler; use a ReadableStream body with HttpResponse for non-SSE chunked transfer.
tags: response, streaming, sse, ReadableStream, EventSource, event-stream
---

# Use `sse()` for Server-Sent Events, ReadableStream for Chunked

## Problem

Some applications use Server-Sent Events or chunked transfer. Returning the entire body at once doesn't test streaming behavior. Hand-rolling the `text/event-stream` framing inside a `ReadableStream` is the older workaround — MSW now has a dedicated `sse` namespace for it.

## Incorrect

```typescript
// Not streaming — entire body returned at once
http.get("/api/stream", () => {
  return HttpResponse.text("data: chunk1\n\ndata: chunk2\n\n", {
    headers: { "Content-Type": "text/event-stream" },
  });
});
```

```typescript
// Second-best: hand-rolled SSE framing. It works, but you own the wire format,
// the headers, and the encoding. Use sse() for Server-Sent Events instead.
http.get("/api/events", () => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode("event: greeting\ndata: Hello, John!\n\n"),
      );
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
});
```

## Correct

Server-Sent Events — use the `sse` handler, which represents the intercepted `EventSource` as `client`:

```typescript
import { sse } from "msw";

export const handlers = [
  sse<{ greeting: string }>("/api/events", ({ client }) => {
    client.send({ id: "abc-123", event: "greeting", data: "Hello, John!" });
    client.close();
  }),
];
```

Non-SSE chunked transfer — a `ReadableStream` body is still the right tool:

```typescript
import { http, HttpResponse, delay } from "msw";

http.get("/api/stream", () => {
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode("chunk1"));
      await delay(100);
      controller.enqueue(new TextEncoder().encode("chunk2"));
      controller.close();
    },
  });

  return new HttpResponse(stream, {
    headers: { "Content-Type": "text/plain" },
  });
});
```

## Why

`sse()` mocks Server-Sent Events at the level your application actually works at: `client.send({ id, event, data })` produces correctly framed events, and `client.close()` gracefully closes the underlying HTTP connection. You never write `data:` prefixes or set `Content-Type` yourself, so the mock cannot drift from the wire format.

A `ReadableStream` body remains the way to simulate any other chunked response — chunks arrive over time, which matters for testing progress indicators and incremental rendering. Returning the full body at once bypasses those code paths. Use `text/plain` (or whatever the endpoint really returns) for these; `text/event-stream` belongs to the `sse` case.

For cleanup of intervals or timeouts started inside a streaming resolver, schedule it with `finalize` (see `rules/handler-resolver-v2.md`) rather than clearing it when the resolver returns.
