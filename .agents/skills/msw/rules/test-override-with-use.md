---
title: Use `server.use()` for Per-Test Overrides
impact: HIGH
description: Override specific handlers for error/edge case tests with `server.use()`. Never modify the shared handlers array or create a new server per test.
tags: testing, override, server.use, error, edge-case
---

# Use `server.use()` for Per-Test Overrides

## Problem

Developers either mutate the shared handlers array, create a new server for each test, or put error handlers in the global handlers list.

## Incorrect

```typescript
// BUG: creating a new server per test is wasteful and error-prone
test('shows error on server failure', async () => {
  const errorServer = setupServer(
    http.get('/api/user', () => new HttpResponse(null, { status: 500 }))
  )
  errorServer.listen()

  render(<UserProfile />)
  await waitFor(() => {
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  errorServer.close()
})
```

## Correct

```typescript
// Shared server with happy-path handlers (defined once)
// import { server } from '../src/mocks/node'

test('shows error on server failure', async () => {
  // Override only the handler you need for this test
  server.use(
    http.get('/api/user', () => {
      return new HttpResponse(null, { status: 500 })
    })
  )

  render(<UserProfile />)
  await waitFor(() => {
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })
  // afterEach(() => server.resetHandlers()) removes this override
})
```

## Why

`server.use()` prepends handlers that take priority over initial handlers. Combined with `afterEach(() => server.resetHandlers())`, this gives each test an isolated override that's automatically cleaned up. One shared server is more efficient than multiple servers.
