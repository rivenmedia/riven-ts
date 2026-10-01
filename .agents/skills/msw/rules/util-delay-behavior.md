---
title: Use Explicit Milliseconds with `delay()` in Tests
impact: MEDIUM
description: "`delay()` and `delay('real')` apply a realistic random delay in the browser, but in Node.js the realistic delay is cut to a few milliseconds. Use `delay(ms)` for predictable test behavior."
tags: utility, delay, timing, node, browser, testing
---

# Use Explicit Milliseconds with `delay()`

## Problem

`await delay()` in a Node.js test environment does not apply the realistic latency it applies in the browser. Upstream: "when testing in Node.js, the implicit delay is negated to prevent it affecting the test performance." Developers expect a ~200ms delay and write timing-dependent assertions against it. `delay('real')` is not an escape hatch — it "explicitly sets the realistic response time", which is the same value the implicit delay uses, so it is reduced in Node.js as well.

## Incorrect

```typescript
// BUG: the realistic delay is cut down in Node.js
http.get('/api/data', async () => {
  await delay() // Effectively instant in Node.js — and so is delay('real')
  return HttpResponse.json({ data: 'loaded' })
})

// Test expects loading state but never sees it
test('shows loading spinner', async () => {
  render(<DataLoader />)
  // Loading spinner never appears because response is instant
  expect(screen.getByRole('progressbar')).toBeInTheDocument() // FAILS
})
```

## Correct

```typescript
http.get("/api/data", async () => {
  await delay(200); // Explicit: always waits 200ms, even in Node.js
  return HttpResponse.json({ data: "loaded" });
});

// For testing timeouts:
http.get("/api/slow", async () => {
  await delay("infinite"); // Never resolves — tests timeout handling
  return HttpResponse.json({ data: "never reached" });
});
```

## Delay Behavior by Environment

| Usage               | Browser           | Node.js                                 | Recommendation                      |
| ------------------- | ----------------- | --------------------------------------- | ----------------------------------- |
| `delay()`           | Random ~100-400ms | Effectively instant                     | Avoid in tests                      |
| `delay(ms)`         | Waits `ms`        | Waits `ms`                              | Use in tests                        |
| `delay('real')`     | Random ~100-400ms | Effectively instant — same as `delay()` | Does NOT restore latency in Node.js |
| `delay('infinite')` | Pends forever     | Pends forever                           | Testing timeouts                    |

## Why

The no-argument `delay()` is designed for browser mocking where you want realistic-feeling latency without slowing down tests: it applies "a random number equal to the average response time you encounter when communicating with an actual HTTP server (~100-400ms)". In Node.js, "the implicit delay is negated to prevent it affecting the test performance".

`delay('real')` is not an escape hatch from that. Upstream defines it as explicitly setting the same realistic response time, and in msw 2.15.0 both routes call the same internal helper — which returns the browser's random 100-400ms but a fixed few milliseconds under Node. So in a test runner, `delay()` and `delay('real')` are interchangeable and neither produces observable latency. If your test depends on a delay (e.g., testing loading states), always specify explicit milliseconds.
