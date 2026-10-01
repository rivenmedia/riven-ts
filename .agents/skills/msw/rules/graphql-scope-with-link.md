---
title: Use `graphql.link()` to Scope Handlers to Specific Endpoints
impact: MEDIUM
description: When an app uses multiple GraphQL APIs, use `graphql.link(url)` to ensure handlers match the correct endpoint.
tags: graphql, link, scope, endpoint, multiple-apis
---

# Use `graphql.link()` to Scope Handlers

## Problem

`graphql.query('GetUser', ...)` matches ANY GraphQL endpoint. If two APIs have the same operation name, handlers conflict.

## Incorrect

```typescript
// BUG: matches GetUser on ANY GraphQL endpoint
graphql.query("GetUser", ({ variables }) => {
  return HttpResponse.json({
    data: { user: { id: variables.id, name: "John" } },
  });
});
// If the app talks to both /graphql and https://api.github.com/graphql,
// this handler intercepts GetUser on BOTH endpoints
```

## Correct

```typescript
const github = graphql.link("https://api.github.com/graphql");
const internal = graphql.link("/graphql");

const handlers = [
  github.query("GetUser", ({ variables }) => {
    return HttpResponse.json({
      data: { user: { login: variables.login, type: "github" } },
    });
  }),
  internal.query("GetUser", ({ variables }) => {
    return HttpResponse.json({
      data: { user: { id: variables.id, type: "internal" } },
    });
  }),
];
```

## Why

`graphql.link(url)` creates a scoped handler namespace that only matches requests to the specified URL. Without scoping, operation name collisions across different GraphQL APIs produce unpredictable mock behavior.
