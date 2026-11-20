# Response API Reference

## Table of Contents

- [HttpResponse Class](#httpresponse-class)
- [Static Methods](#static-methods)
- [Response Init Options](#response-init-options)
- [Cookie Handling](#cookie-handling)
- [Comparison with Native Response](#comparison-with-native-response)

## HttpResponse Class

`HttpResponse` extends the native `Response` class. It can be used anywhere a `Response` is expected but keeps forbidden headers like `Set-Cookie`, which a browser drops from a native `Response`.

```typescript
import { HttpResponse } from "msw/http";
```

### Constructor

```text
new HttpResponse(body?, init?)
```

- `body` — `Blob | ArrayBuffer | TypedArray | DataView | FormData | ReadableStream | URLSearchParams | string | null | undefined`
- `init` — `{ status?, statusText?, headers? }`

`HttpResponse` has the identical constructor signature to the Fetch API `Response` class, including static methods such as `Response.json()` and `Response.error()`.

```typescript
// Plain body with custom status
new HttpResponse("Not Found", { status: 404 });

// No body
new HttpResponse(null, { status: 204 });

// Streaming body
new HttpResponse(readableStream, {
  headers: { "Content-Type": "text/event-stream" },
});
```

## Static Methods

7 static methods for common response types:

| Method                                  | Content-Type          | Description     |
| --------------------------------------- | --------------------- | --------------- |
| `HttpResponse.json(body, init?)`        | `application/json`    | JSON response   |
| `HttpResponse.text(body, init?)`        | `text/plain`          | Plain text      |
| `HttpResponse.html(body, init?)`        | `text/html`           | HTML content    |
| `HttpResponse.xml(body, init?)`         | `text/xml`            | XML content     |
| `HttpResponse.formData(body, init?)`    | `multipart/form-data` | Form data       |
| `HttpResponse.arrayBuffer(body, init?)` | (none)                | Binary data     |
| `HttpResponse.error()`                  | (network error)       | Network failure |

### HttpResponse.json()

```typescript
HttpResponse.json({ name: "John", age: 30 });
HttpResponse.json({ name: "John" }, { status: 201 });
HttpResponse.json({ error: "Not found" }, { status: 404 });
HttpResponse.json([{ id: 1 }, { id: 2 }]); // arrays work too
```

### HttpResponse.text()

```typescript
HttpResponse.text("Hello, world!");
HttpResponse.text("Created", { status: 201 });
```

### HttpResponse.html()

```typescript
HttpResponse.html("<h1>Hello</h1>");
HttpResponse.html("<!DOCTYPE html><html><body>Page</body></html>");
```

### HttpResponse.xml()

```typescript
HttpResponse.xml("<user><name>John</name></user>");
```

### HttpResponse.formData()

```typescript
const form = new FormData();
form.append("name", "John");
form.append("avatar", new Blob(["..."], { type: "image/png" }));
HttpResponse.formData(form);
```

### HttpResponse.arrayBuffer()

```typescript
const buffer = new ArrayBuffer(8);
HttpResponse.arrayBuffer(buffer);
// Sets Content-Length from the buffer's byte length.
```

### HttpResponse.error()

Creates a network error response (`type: "error"`). The client's `fetch` rejects with a `TypeError` (Node.js: "fetch failed"; each browser has its own text).

```typescript
HttpResponse.error();
// No arguments — network errors have no body, status, or headers
```

## Response Init Options

All static methods and the constructor accept an optional init object:

```typescript
HttpResponse.json(
  { name: "John" },
  {
    status: 201,
    statusText: "Created",
    headers: {
      "X-Custom-Header": "value",
      "Set-Cookie": "token=abc; Path=/; HttpOnly",
    },
  },
);
```

### Multiple headers with same name

```typescript
new HttpResponse(null, {
  headers: [
    ["Set-Cookie", "session=abc"],
    ["Set-Cookie", "theme=dark"],
  ],
});
```

## Cookie Handling

In the browser, a native `Response` drops `Set-Cookie` from its constructor headers. `HttpResponse` keeps it. Node.js keeps the header on both classes, so only `HttpResponse` behaves the same in both environments:

```typescript
// GOOD: HttpResponse supports Set-Cookie
new HttpResponse(null, {
  headers: { "Set-Cookie": "session=abc123" },
});

// BAD: in the browser, native Response silently drops Set-Cookie
new Response(null, {
  headers: { "Set-Cookie": "session=abc123" },
});
```

### Multiple cookies

```typescript
new HttpResponse(null, {
  headers: [
    ["Set-Cookie", "session=abc123; Path=/; HttpOnly"],
    ["Set-Cookie", "theme=dark; Path=/"],
  ],
});
```

## Comparison with Native Response

| Feature             | `Response`                              | `HttpResponse`                                             |
| ------------------- | --------------------------------------- | ---------------------------------------------------------- |
| JSON body           | Manual `JSON.stringify`                 | `HttpResponse.json()` auto-serializes                      |
| Content-Type        | Must set manually                       | Auto-set by static methods                                 |
| Content-Length      | Must set manually                       | Auto-set by `.arrayBuffer()` from the buffer's byte length |
| Set-Cookie          | Dropped in the browser; kept in Node.js | Supported                                                  |
| Network error       | `Response.error()`                      | `HttpResponse.error()`                                     |
| Use in MSW handlers | Yes (except cookies in the browser)     | Yes (full support)                                         |
