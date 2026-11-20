---
title: Import Server/Worker from Correct Subpaths
impact: CRITICAL
description: Use `msw/node` for setupServer and `msw/browser` for setupWorker. Never import these from `msw`.
tags: setup, import, node, browser, subpath
---

# Import Server/Worker from Correct Subpaths

## Problem

Developers import `setupServer` from `'msw'` instead of `'msw/node'`. The root `'msw'` module does not export `setupServer` or `setupWorker`.

## Incorrect

```typescript
// BUG: setupServer is not exported from 'msw'
// @ts-expect-error setupServer is exported from 'msw/node', not 'msw'
import { setupServer } from "msw";
```

## Correct

```typescript
// Node.js (tests, SSR)
import { setupServer } from "msw/node";

// Browser (Storybook, development)
import { setupWorker } from "msw/browser";

// Handlers and response utilities come from 'msw/http' (v3 subpath)
import { http, HttpResponse } from "msw/http";
import { graphql } from "msw/graphql";
```

## Import Map

| Export                           | Import from                                                          |
| -------------------------------- | -------------------------------------------------------------------- |
| `http`, `HttpResponse`           | `'msw/http'`                                                         |
| `graphql`                        | `'msw/graphql'` (install the `graphql` package)                      |
| `ws`, `sse`                      | `'msw/ws'`, `'msw/sse'`                                              |
| `delay`, `bypass`, `passthrough` | `'msw/utils/delay'`, `'msw/utils/bypass'`, `'msw/utils/passthrough'` |
| `setupServer`                    | `'msw/node'`                                                         |
| `setupWorker`                    | `'msw/browser'`                                                      |
| `setupServer` (React Native)     | `'@msw/react-native'`                                                |

## Why

MSW uses subpath exports to tree-shake correctly. Importing `setupServer` from `'msw'` produces an import error. The split ensures browser code doesn't bundle Node.js dependencies and vice versa.

React Native has a third subpath, `'@msw/react-native'`. It exports the same `setupServer` API but ships the interceptors relevant to the React Native environment. `msw/node` pulls in Node.js modules such as `http` that do not exist in React Native, so replace any `msw/node` import in React Native code with `@msw/react-native`.
