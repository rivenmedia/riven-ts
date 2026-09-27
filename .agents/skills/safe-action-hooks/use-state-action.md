# useStateAction

## Import

```ts
// Primary import (recommended)
import { useStateAction } from "next-safe-action/hooks";

// Backward-compatible re-export (same hook)
import { useStateAction } from "next-safe-action/stateful-hooks";
```

## Server-Side Definition

`useStateAction` requires actions defined with `.stateAction()` (not `.action()`). The server code receives a second argument with `prevResult`. Because `<form action={formAction}>` submits raw `FormData`, the input schema must parse `FormData` (e.g. with `zod-form-data`):

```ts
"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClient } from "@/lib/safe-action";

export const submitFeedback = actionClient
  .inputSchema(
    zfd.formData({
      rating: zfd.numeric(z.number().min(1).max(5)),
      comment: zfd.text(z.string()),
    }),
  )
  .stateAction(async ({ parsedInput, ctx }, { prevResult }) => {
    // prevResult is the previous SafeActionResult (structuredClone'd)
    const previousRating = prevResult.data?.rating;

    await db.feedback.create({
      data: { ...parsedInput, previousRating },
    });

    return {
      rating: parsedInput.rating,
      submittedAt: new Date().toISOString(),
    };
  });
```

## Queued Dispatches

Forms are the most common use, but not the defining one. `useStateAction` is built on React's `useActionState`, which **queues** dispatches: each waits for the previous to settle and receives its result as `prevResult`. That makes it the right tool whenever writes must not overtake each other, forms or not. For the optimistic version of that, see [useOptimisticStateAction](./use-optimistic-state-action.md).

## Basic Usage

```tsx
"use client";

import { useStateAction } from "next-safe-action/hooks";
import { submitFeedback } from "@/app/actions";

export function FeedbackForm() {
  const { formAction, result, isPending, hasSucceeded, reset } = useStateAction(
    submitFeedback,
    {
      onSuccess: ({ data }) => {
        console.log("Submitted:", data);
      },
      onError: ({ error }) => {
        console.error("Failed:", error.serverError);
      },
    },
  );

  return (
    <form action={formAction}>
      <select name="rating">
        <option value="1">1</option>
        <option value="2">2</option>
        <option value="3">3</option>
        <option value="4">4</option>
        <option value="5">5</option>
      </select>
      <textarea name="comment" placeholder="Your feedback..." />

      {result.validationErrors?.comment && (
        <p className="text-red-500">
          {result.validationErrors.comment._errors[0]}
        </p>
      )}
      {result.serverError && (
        <p className="text-red-500">{result.serverError}</p>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </button>
      {hasSucceeded && <p>Thank you for your feedback!</p>}
    </form>
  );
}
```

## Return Value

`useStateAction` returns everything `useAction` returns, plus `formAction`:

| Property              | Type                         | Description                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute(input)`      | `(input) => void`            | Fire-and-forget execution (programmatic trigger)                                                                                                                                                                                                                                                                                                     |
| `executeAsync(input)` | `(input) => Promise<Result>` | Returns a promise with the result                                                                                                                                                                                                                                                                                                                    |
| `formAction`          | `(input) => void`            | Dispatcher for `<form action={formAction}>` pattern                                                                                                                                                                                                                                                                                                  |
| `input`               | `Input \| undefined`         | Last input dispatched (via `execute`, `executeAsync`, or `formAction`)                                                                                                                                                                                                                                                                               |
| `result`              | `SafeActionResult`           | Last action result — **discriminated union** of 4 branches (idle / success / serverError / validationErrors); narrowed when you check `status` or any `has*` shorthand                                                                                                                                                                               |
| `reset()`             | `() => void`                 | Resets client state to initial (restores `initResult` if provided) and ignores the result of any in-flight execution. It does **not** cancel the server call already in flight. On the queued hooks (`useStateAction`, `useOptimisticStateAction`) it also skips every dispatch still waiting its turn: their action never runs and no write happens |
| `status`              | `HookActionStatus`           | Current status string                                                                                                                                                                                                                                                                                                                                |
| `isIdle`              | `boolean`                    | No execution has started yet                                                                                                                                                                                                                                                                                                                         |
| `isExecuting`         | `boolean`                    | Action promise is pending                                                                                                                                                                                                                                                                                                                            |
| `isTransitioning`     | `boolean`                    | React transition is pending                                                                                                                                                                                                                                                                                                                          |
| `isPending`           | `boolean`                    | `isExecuting \|\| isTransitioning`, except after `reset()`: a reset reports idle immediately, even while the uncancellable transition it interrupted is still settling                                                                                                                                                                               |
| `hasSucceeded`        | `boolean`                    | Last execution completed without errors (a void action succeeds with `result.data` still `undefined`)                                                                                                                                                                                                                                                |
| `hasErrored`          | `boolean`                    | Last execution had `serverError`, `validationErrors`, or threw (a raw throw leaves `result` empty)                                                                                                                                                                                                                                                   |
| `hasNavigated`        | `boolean`                    | Last execution triggered a navigation                                                                                                                                                                                                                                                                                                                |

## initResult Option

Seed the initial result state (before any execution). The shape you pass precisely types the idle branch's `result`, so `result.data` is narrowed before any call is made:

```tsx
const { result } = useStateAction(myStatefulAction, {
  initResult: { data: { count: 0 } },
});

// result.data.count is 0 before first execution (narrowed — no optional chaining needed)
```

The value is captured **once at mount**, like React's `useActionState` initial state: later changes to the option are ignored, and `reset()` restores the mount value. `initResult` is not unique to `useStateAction` — `useAction` and `useOptimisticAction` accept it too (see [initResult](./use-action.md#initresult)).

## formAction vs execute

| Trigger               | Use When                                                                              |
| --------------------- | ------------------------------------------------------------------------------------- |
| `formAction`          | Form submissions via `<form action={formAction}>`. Input is extracted from form data. |
| `execute(input)`      | Programmatic triggers (button clicks, events). Input is passed directly.              |
| `executeAsync(input)` | Programmatic triggers where you need to await the result inline.                      |

Both `formAction` and `execute` support all callbacks and status tracking.

## When to Use Which Hook

### Quick Rules

- **Default to `useAction`** unless you specifically need `formAction` or `prevResult`.
- **Use `useStateAction`** only with `.stateAction()` on the server, when you need `<form action={formAction}>` or previous result access.
- **Use React's `useActionState` directly** when progressive enhancement (no-JS form submission) is required.

### Feature Comparison

| Feature                | `useAction`                           | `useStateAction`               | `useActionState` (React)        |
| ---------------------- | ------------------------------------- | ------------------------------ | ------------------------------- |
| Works without JS       | No                                    | No                             | Yes                             |
| Previous result access | No                                    | Yes (via `.stateAction()`)     | Yes (via `.stateAction()`)      |
| Form action support    | No (`onSubmit` only)                  | Yes (`formAction`)             | Yes (`dispatch`)                |
| Loading states         | `isExecuting`, `isPending`            | `isExecuting`, `isPending`     | `isPending`                     |
| Lifecycle callbacks    | Full                                  | Full                           | None                            |
| Navigation tracking    | `onNavigation`, `hasNavigated`        | `onNavigation`, `hasNavigated` | Error boundary only             |
| `throwOnNavigation`    | Yes                                   | Yes                            | N/A (always throws)             |
| `reset()`              | Yes                                   | Yes                            | No                              |
| `executeAsync`         | Yes                                   | Yes                            | No                              |
| Action method          | `.action()`                           | `.stateAction()`               | `.stateAction()`                |
| Best for               | Interactive UI, programmatic triggers | Forms with callbacks and state | Forms that must work without JS |

### Scenario-Based Guidance

- **Use `useAction`** when you don't need previous result access, your triggers are programmatic (buttons, events), or you're building interactive UI that doesn't use `<form action={...}>`.
- **Use `useStateAction`** when you need previous result access (`prevResult` in server code), you're building forms with rich callbacks and status tracking, you want the `<form action={formAction}>` pattern with full DX, or you need overlapping writes queued rather than raced.
- **Use `useOptimisticStateAction`** when you need all of that _plus_ instant UI: it is `useStateAction` with an optimistic fold on top. See [useOptimisticStateAction](./use-optimistic-state-action.md).
- **Use `useActionState` directly** when you need no-JS progressive enhancement (form must submit before JavaScript loads), or you want the simplest possible form setup and don't need lifecycle callbacks.

## Gotchas

- **Don't use `useStateAction` just because you have a form.** If you don't need `prevResult`, `<form action={formAction}>`, or queued dispatches, use `useAction` + `onSubmit` instead. It's simpler and works with `.action()`.
- **React 19+ required.** `useStateAction` wraps React's `useActionState`, which is only available in React 19 (Next.js 15+). A clear runtime error is thrown if React 18 is detected.
- **Must use `.stateAction()`, not `.action()`.** The server-side action must be defined with `.stateAction()` to receive the `prevResult` parameter. Using `.action()` will cause a type error.
- **`formAction` passes raw input.** When using `<form action={formAction}>`, the input is the raw `FormData`, not a parsed object. Your input schema must handle this (e.g., use `zod-form-data` or extract fields in the schema).
- **`prevResult` is `structuredClone`'d.** The previous result passed to the server goes through `structuredClone`, which **throws** on values it cannot clone (functions, symbols, DOM nodes). Keep the result data structured-cloneable.
- **Does NOT support no-JS progressive enhancement.** The hook wraps the action to enable error tracking and callbacks, which requires JavaScript. For forms that must work without JavaScript, use React's `useActionState` directly.
