---
title: Always Await Body Reading Methods
impact: HIGH
description: In v2, request body is read via async Fetch API methods — `await request.json()`, `await request.text()`, `await request.formData()`.
tags: request, body, async, await, json, formData
---

# Always Await Body Reading Methods

## Problem

v1 auto-parsed request bodies. In v2, the `request` is a standard Fetch API `Request` — body reading is always async.

## Incorrect

```typescript
// BUG: request.body is a ReadableStream, not parsed data
http.post("/api/user", ({ request }) => {
  const body = request.body; // ReadableStream, not the parsed body!
  return HttpResponse.json({ received: body });
});
```

## Correct

```typescript
http.post("/api/user", async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ received: body });
});

// Other body reading methods:
// await request.text()
// await request.formData()
// await request.arrayBuffer()
// await request.blob()
```

## Body Reading Methods

| Method                        | Returns       | Use for                        |
| ----------------------------- | ------------- | ------------------------------ |
| `await request.json()`        | Parsed object | JSON payloads                  |
| `await request.text()`        | String        | Plain text, HTML               |
| `await request.formData()`    | `FormData`    | Form submissions, file uploads |
| `await request.arrayBuffer()` | `ArrayBuffer` | Binary data                    |
| `await request.blob()`        | `Blob`        | Binary data with MIME type     |

## Why

v2 uses the standard Fetch API `Request` object. Body reading methods return Promises because the body is a stream. The resolver must be `async` or return a Promise when reading the body.
