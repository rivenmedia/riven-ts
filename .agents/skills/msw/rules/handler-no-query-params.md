---
title: Never Put Query Parameters in Handler URL Predicates
impact: CRITICAL
description: Query parameters in handler URLs are stripped before matching, so the handler matches every request to that path. Read them from `request.url` inside the resolver instead.
tags: handler, url, query-params, predicate, over-matching
---

# Never Put Query Parameters in Handler URL Predicates

## Problem

Developers put query params in the handler URL string. MSW strips them from the predicate before matching, so `http.get('/post?id=1', ...)` behaves exactly like `http.get('/post', ...)`. It does not match nothing — it matches _everything_ on that path, and every request receives the `id=1` fixture.

## Incorrect

```typescript
// BUG: the query string is stripped, so this is just http.get('/post').
// It serves this response to '/post?id=1', '/post?id=2' AND bare '/post'.
http.get("/post?id=1", () => {
  return HttpResponse.json({ id: 1, title: "First Post" });
});
```

## Correct

```typescript
http.get("/post", ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (id === "1") {
    return HttpResponse.json({ id: 1, title: "First Post" });
  }

  return HttpResponse.json({ error: "Not found" }, { status: 404 });
});
```

## Why

MSW matches handlers by pathname only; query parameters are stripped from the predicate before matching. Including them does not narrow the handler — it widens it to every request on that path, so a request for `?id=2` is served the `id=1` response.

It is not silent either. MSW warns at handler registration:

```
[MSW] Found a redundant usage of query parameters in the request handler URL for
"GET /post?id=1". Please match against a path instead and access query parameters
using "new URL(request.url).searchParams" instead.
```
