---
title: Import Server/Worker from Correct Subpaths
impact: CRITICAL
description: Use `msw/node` for setupServer and `msw/browser` for setupWorker. Never import these from `msw`.
tags: setup, import, node, browser, subpath
---

# Import Server/Worker from Correct Subpaths

## Problem

Developers import `setupServer` from `'msw'` instead of `'msw/node'`. The top-level `'msw'` export only contains `http`, `graphql`, `HttpResponse`, etc.

## Incorrect

```typescript
// BUG: setupServer is not exported from 'msw'
import { setupServer } from "msw";
```

## Correct

```typescript
// Node.js (tests, SSR)
import { setupServer } from "msw/node";

// Browser (Storybook, development)
import { setupWorker } from "msw/browser";

// Handlers and response utilities come from 'msw'
import { http, HttpResponse, graphql } from "msw";
```

## Import Map

| Export                                                                           | Import from     |
| -------------------------------------------------------------------------------- | --------------- |
| `http`, `graphql`, `sse`, `ws`, `HttpResponse`, `delay`, `bypass`, `passthrough` | `'msw'`         |
| `setupServer`                                                                    | `'msw/node'`    |
| `setupWorker`                                                                    | `'msw/browser'` |
| `setupServer` (React Native)                                                     | `'msw/native'`  |

## Why

MSW v2 uses subpath exports to tree-shake correctly. Importing `setupServer` from `'msw'` produces an import error. The split ensures browser code doesn't bundle Node.js dependencies and vice versa.

React Native has a third subpath, `'msw/native'`. It exports the same `setupServer` API but ships the interceptors relevant to the React Native environment. `msw/node` pulls in Node.js modules such as `http` that do not exist in React Native, so replace any `msw/node` import in React Native code with `msw/native`.
