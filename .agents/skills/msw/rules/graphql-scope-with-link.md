---
title: Use `graphql.link()` to Scope Handlers to Specific Endpoints
impact: MEDIUM
description: When an app uses multiple GraphQL APIs, give each API its own `graphql.link(url)`. A wildcard or RegExp link matches the operation on every endpoint.
tags: graphql, link, scope, endpoint, multiple-apis
---

# Use `graphql.link()` to Scope Handlers

## Problem

In v3, every GraphQL operation is defined on a link. A link with a wildcard or RegExp URL (`'*'`, `'*/graphql'`, `/graphql$/`) matches the operation on every GraphQL endpoint. If two APIs have an operation with the same name, one handler answers both.

## Incorrect

```typescript
import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";

// BUG: a wildcard link matches GetUser on ANY GraphQL endpoint
const anyGraphql = graphql.link("*");

anyGraphql.query("GetUser", ({ variables }) => {
  return HttpResponse.json({
    data: { user: { id: variables.id, name: "John" } },
  });
});
// If the app talks to both /graphql and https://api.github.com/graphql,
// this handler intercepts GetUser on BOTH endpoints
```

## Correct

```typescript
import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";

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

`graphql.link(url)` creates a handler namespace that only matches requests to the URL it is given. With one exact link per API, operations with the same name on different APIs get different handlers. With a wildcard or RegExp link, the first matching handler answers every endpoint (checked on msw 3.0.3 with `'*'`, `'*/graphql'` and `/graphql$/`).
