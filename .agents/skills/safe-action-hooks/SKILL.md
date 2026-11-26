---
name: safe-action-hooks
description: Use when executing next-safe-action actions from React client components or building optimistic UI -- useAction, useOptimisticAction, useStateAction, useOptimisticStateAction, status/callbacks (onSuccess/onError/onSettled), execute vs executeAsync, formAction, reset, and queued or serialized mutations such as drag-to-reorder, Kanban boards, overlapping saves, accumulating changes, and shared pending-change lists
---

# next-safe-action React Hooks

## Import

```ts
// All hooks
import {
  useAction,
  useOptimisticAction,
  useStateAction,
  useOptimisticStateAction,
} from "next-safe-action/hooks";

// Backward-compatible re-export (same useStateAction hook)
import { useStateAction } from "next-safe-action/stateful-hooks";
```

## Which Hook

| Hook                       | Action method    | Use for                                                                                                          |
| -------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------- |
| `useAction`                | `.action()`      | Programmatic triggers, interactive UI, most cases                                                                |
| `useOptimisticAction`      | `.action()`      | Instant UI for changes that **replace** state (last-write-wins)                                                  |
| `useStateAction`           | `.stateAction()` | `<form action={formAction}>`, `prevResult` on the server, queued dispatches                                      |
| `useOptimisticStateAction` | `.stateAction()` | Instant UI for changes that **accumulate**: overlapping writes are queued, each folding over the confirmed state |

Pick by action kind first: `.action()` pairs with `useAction` / `useOptimisticAction`, `.stateAction()` pairs with `useStateAction` / `useOptimisticStateAction`.

## useAction — Quick Start

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { createUser } from "@/app/actions";

export function CreateUserForm() {
  const { execute, result, status, isExecuting, isPending } = useAction(
    createUser,
    {
      onSuccess: ({ data }) => {
        console.log("User created:", data);
      },
      onError: ({ error }) => {
        console.error("Failed:", error.serverError);
      },
    },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        execute({ name: formData.get("name") as string });
      }}
    >
      <input name="name" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Creating..." : "Create User"}
      </button>
      {result.serverError && <p className="error">{result.serverError}</p>}
      {result.data && <p className="success">Created: {result.data.id}</p>}
    </form>
  );
}
```

## useOptimisticAction — Quick Start

```tsx
"use client";

import { useOptimisticAction } from "next-safe-action/hooks";
import { toggleTodo } from "@/app/actions";

export function TodoItem({ todo }: { todo: Todo }) {
  const { execute, optimisticState } = useOptimisticAction(toggleTodo, {
    currentState: todo,
    updateFn: (state, input) => ({
      ...state,
      completed: !state.completed,
    }),
  });

  return (
    <label>
      <input
        type="checkbox"
        checked={optimisticState.completed}
        onChange={() => execute({ todoId: todo.id })}
      />
      {todo.title}
    </label>
  );
}
```

## useOptimisticStateAction — Quick Start

For overlapping writes that must **accumulate** (reorder an item, then reorder it again before the first save lands). Dispatches are queued: each waits for the previous to settle, and the server receives the last confirmed state as `prevResult`.

```tsx
"use client";

import { useOptimisticStateAction } from "next-safe-action/hooks";
import { moveItem } from "@/app/actions";
import { reorder } from "@/lib/reorder"; // the same reducer the server runs

export function ReorderList({ items }: { items: Item[] }) {
  const { execute, optimisticState, isPending } = useOptimisticStateAction(
    moveItem,
    {
      currentState: items, // must be a stable reference — compared by identity
      updateFn: reorder,
    },
  );

  return (
    <ul data-saving={isPending}>
      {optimisticState.map((item) => (
        <li key={item.id}>
          {item.label}
          <button onClick={() => execute({ id: item.id, direction: "up" })}>
            Up
          </button>
        </li>
      ))}
    </ul>
  );
}
```

The action must be a `.stateAction()`, and **must revalidate** the state the page renders:

```ts
"use server";

export const moveItem = actionClient
  .inputSchema(moveSchema)
  .stateAction(async ({ parsedInput }, { prevResult }) => {
    const next = reorder(prevResult.data!, parsedInput); // always the last confirmed state
    await db.items.save(next);
    revalidatePath("/items");
    return next;
  });
```

See [useOptimisticStateAction in depth](./use-optimistic-state-action.md) for the decision rules, the pending-changes-list shape, and the gotchas.

## useStateAction — Quick Start

```tsx
"use client";

import { useStateAction } from "next-safe-action/hooks";
import { submitFeedback } from "@/app/actions";

export function FeedbackForm() {
  const { formAction, result, isPending, hasSucceeded } = useStateAction(
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
      <input name="rating" type="number" min="1" max="5" required />
      <textarea name="comment" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit"}
      </button>
      {result.validationErrors?.comment && (
        <p className="error">{result.validationErrors.comment._errors[0]}</p>
      )}
      {hasSucceeded && <p className="success">Thank you!</p>}
    </form>
  );
}
```

The server-side action must use `.stateAction()` (not `.action()`). `<form action={formAction}>` submits raw `FormData`, so the input schema must parse `FormData` (e.g. with `zod-form-data`):

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
  .stateAction(async ({ parsedInput }, { prevResult }) => {
    // prevResult contains the previous SafeActionResult
    await db.feedback.create({ data: parsedInput });
    return { rating: parsedInput.rating };
  });
```

## Return Value

All hooks (`useAction`, `useOptimisticAction`, `useStateAction`, `useOptimisticStateAction`) return:

| Property              | Type                         | Description                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `execute(input)`      | `(input) => void`            | Fire-and-forget execution                                                                                                                                                                                                                                                                                                                            |
| `executeAsync(input)` | `(input) => Promise<Result>` | Returns a promise with the result                                                                                                                                                                                                                                                                                                                    |
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

`useOptimisticAction` additionally returns:
| `optimisticState` | `State` | The optimistically-updated state |

`useStateAction` additionally returns:
| `formAction` | `(input) => void` | Dispatcher for `<form action={formAction}>` pattern |

`useOptimisticStateAction` returns everything `useStateAction` returns, plus:
| `optimisticState` | `State` | Confirmed state folded with every in-flight change (always defined) |

The hook return is itself a **discriminated union** keyed on `status` and every `has*` / `is*` shorthand (each typed as literal `true` / `false` per branch). Narrowing any discriminant narrows `result` — e.g. inside `if (hasSucceeded)`, `result.data` is `Data` (not `Data | undefined`). See [Type narrowing via hook status](./use-action.md#type-narrowing-via-hook-status).

## initResult Option

All hooks accept `initResult` to seed the hook with a preloaded result (e.g. data fetched on the server): in the opts object for `useAction`/`useStateAction`, in the utils object (alongside `currentState`/`updateFn`) for `useOptimisticAction`/`useOptimisticStateAction`. The value is captured **once at mount** (like React's `useActionState` initial state): later changes to the option are ignored, and `reset()` restores the mount value. The seeded shape precisely types the idle branch's `result`. See [initResult in depth](./use-action.md#initresult).

## Supporting Docs

- [execute vs executeAsync, result handling](./use-action.md)
- [useStateAction in depth (decision table, formAction)](./use-state-action.md)
- [Optimistic updates with useOptimisticAction](./optimistic-updates.md)
- [useOptimisticStateAction: queued optimistic updates for overlapping writes](./use-optimistic-state-action.md)
- [Status lifecycle and all callbacks](./status-callbacks.md)
- [throwOnNavigation flag](./throw-on-navigation.md)

## Anti-Patterns

```ts
// BAD: Using executeAsync without try/catch when navigation errors are possible
const handleClick = async () => {
  const result = await executeAsync({ id }); // Throws on redirect!
  showToast(result.data);
};

// GOOD: Wrap executeAsync in try/catch
const handleClick = async () => {
  try {
    const result = await executeAsync({ id });
    showToast(result.data);
  } catch (e) {
    // Handle non-navigation errors here if needed, then re-throw
    // Navigation errors must propagate to Next.js
    throw e;
  }
};
```

```tsx
// BAD: Last-write-wins for changes that accumulate — the second move builds on stale state,
// and the response of the first move is discarded
const { execute } = useOptimisticAction(moveItem, {
  currentState: items,
  updateFn: reorder,
});

// GOOD: Queued dispatches, each folding over the previous result
const { execute } = useOptimisticStateAction(moveItem, {
  currentState: items,
  updateFn: reorder,
});
```

```ts
// BAD: Using .action() with useStateAction — type error
const myAction = actionClient.inputSchema(schema).action(async ({ parsedInput }) => { ... });
useStateAction(myAction); // TypeScript error!

// GOOD: Use .stateAction() for useStateAction
const myAction = actionClient.inputSchema(schema).stateAction(async ({ parsedInput }, { prevResult }) => { ... });
useStateAction(myAction); // Works!
```
