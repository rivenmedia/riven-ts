# useOptimisticStateAction

Optimistic UI for **stateful** actions, with **queued** dispatches. Built on React's `useActionState`: each dispatch waits for the previous one to settle, and the server receives the last confirmed state as `prevResult`.

```ts
import { useOptimisticStateAction } from "next-safe-action/hooks";
```

Requires React 19+ (Next.js 15+) — the hook throws a clear runtime error otherwise — and an action defined with `.stateAction()`, exactly like `useStateAction`.

## The Model

One idea: **a confirmed base, folded with every in-flight change.**

```
optimisticState = updateFn(updateFn(confirmed, change1), change2)
```

Confirmed state is the **more recent** of:

1. the action's successful `data`, and
2. the `currentState` option.

"More recent" is answered **twice**, because the confirmed value feeds two different things:

- **What you render** goes by **arrival**. Any new `currentState` identity supersedes the committed result, so a revalidated Server Component payload beats a stale client-side fold even when the snapshot was taken before the newest write. That is why every action writing rendered state must revalidate it.
- **The base the next queued dispatch sends as `prevResult`** goes by **write order**. A `currentState` that commits while an action is still running was rendered before that action wrote, so the action's own `data` wins when it settles. A `currentState` arriving with nothing in flight wins instead.

The second rule matters when a payload lands mid-queue: it usually acknowledges the dispatch _before_ the running one, and treating it as newer would drop the running dispatch's write and let the dispatch after it overwrite the change.

An action that returns the full next state owns the confirmed value; an action that returns nothing leaves `currentState` authoritative.

## Pick By Action Kind

`.action()` pairs with `useOptimisticAction`. `.stateAction()` pairs with `useOptimisticStateAction` — exactly as `useAction` pairs with `useStateAction`.

| Hook                       | Concurrency                                                                   | Action method    |
| -------------------------- | ----------------------------------------------------------------------------- | ---------------- |
| `useOptimisticAction`      | Last-write-wins: the newer response is kept, the older discarded              | `.action()`      |
| `useOptimisticStateAction` | Queued: each dispatch waits for the previous and receives the confirmed state | `.stateAction()` |

## When To Use It

All three must hold:

- **The UI needs optimistic updates.** `useStateAction` already queues dispatches (it is the same `useActionState` machinery), so serialization alone is _not_ a reason to reach for the optimistic hook.
- **Each mutation depends on the confirmed result of the previous one.** A drag that reorders an item, then reorders it again before the first save lands: the second write must build on the result of the first, and dropping a response there loses information.
- **The dispatches belong to one queue**, i.e. one hook instance. Separate instances do not share a fold, a queue, or a pending list.

The sibling-component case ("several components render the same in-flight changes") works only when **one** provider owns **one** hook instance and shares its `optimisticState` through context. See [Shape 2](#shape-2-pending-changes-list).

## When NOT To Use It

- **Each input is a self-contained desired value and only the latest response matters.** Use `useOptimisticAction`. Saving a title is the clear case. Careful with "toggle": `{ liked: !liked }` computed from the previous value _accumulates_; `{ liked: true }` sent as the desired final value _replaces_.
- **No optimistic UI is needed.** If the action needs `prevResult`, `<form action={formAction}>`, or queued writes, use `useStateAction`. If it needs none of those, use a plain `.action()` with `useAction` — simpler.
- **The action is defined with `.action()`.** This hook requires `.stateAction()`; queueing comes from `useActionState`, which only the stateful path uses.
- **Data changes independently of the user** (sockets, polling, background refresh, other actors). This pattern assumes confirmed data lives in Server Components and the optimistic layer disappears when the action finishes. Use TanStack Query or SWR directly for reads and cache ownership — the next-safe-action TanStack Query adapter only builds mutation options, and only for stateless `.action()` functions.
- **`currentState` cannot be given a stable identity.** See [identity](#currentstate-is-compared-by-identity).

### Cost

Serializing is the point of the hook, and N changes are N sequential requests. Do not assume `useOptimisticAction` avoids that: Next.js already runs Server Actions through a single global queue in the App Router, so requests go one at a time either way. What differs is the **state semantics**, not the round-trip count. Splitting into one hook per entity gives each entity its own `prevResult` chain but buys no network parallelism. If round trips are the bottleneck, batch or coalesce compatible changes into one action.

## Shape 1: Reduced State

The action returns the full next state, and the same reducer runs on the client and the server.

```ts
// src/features/layout/reducer.ts
export type LayoutChange =
  | { type: "rename"; id: string; name: string }
  | { type: "move"; id: string; toGroup: string; toIndex: number };

export function layoutReducer(groups: Group[], change: LayoutChange): Group[] {
  switch (change.type) {
    case "rename":
      return groups.map((g) =>
        g.id === change.id ? { ...g, name: change.name } : g,
      );
    case "move":
      return moveChannel(groups, change);
  }
}
```

```ts
// src/app/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { actionClient } from "@/lib/safe-action";
import { layoutReducer } from "@/features/layout/reducer";

export const saveLayout = actionClient
  .inputSchema(layoutChangeSchema)
  .stateAction(async ({ parsedInput }, { prevResult }) => {
    // prevResult.data is the last confirmed state: the hook substitutes it when a dispatch
    // fails, so one rejected write can't leave the queue without a base. It is still typed
    // as optional, so narrow it or assert it.
    const next = layoutReducer(prevResult.data!, parsedInput);
    await db.layout.save(next);

    // Required whenever the page renders revalidated server data — even though this action
    // already returns the next state. See "Always revalidate".
    revalidatePath("/channels");

    return next;
  });
```

```tsx
// src/app/channel-nav.tsx
"use client";

import { useOptimisticStateAction } from "next-safe-action/hooks";
import { saveLayout } from "./actions";
import { layoutReducer } from "@/features/layout/reducer";

export function ChannelNav({ groups }: { groups: Group[] }) {
  const { optimisticState, execute, isPending } = useOptimisticStateAction(
    saveLayout,
    {
      currentState: groups,
      updateFn: layoutReducer,
    },
  );

  return (
    <nav aria-label="Channels" data-saving={isPending}>
      {optimisticState.map((group) => (
        <ChannelGroup key={group.id} group={group} onChange={execute} />
      ))}
    </nav>
  );
}
```

Every change renders immediately, saves run one after another, and a failed save converges back to the last confirmed layout with no reverse change to write.

## Shape 2: Pending Changes List

When several components need the same in-flight changes, keep the confirmed data in Server Components and let one provider's hook hold **only the pending list**. Use a constant base and an append reducer:

```tsx
// src/providers/calendar-events-provider.tsx
"use client";

import { useOptimisticStateAction } from "next-safe-action/hooks";
import { saveEventChange } from "@/app/actions";

// Hoisted so the identity is stable — an inline [] would be a new value every render.
const NO_PENDING: EventChange[] = [];

export function CalendarEventsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { optimisticState: pendingChanges, execute } = useOptimisticStateAction(
    saveEventChange,
    {
      currentState: NO_PENDING,
      updateFn: (changes, change) => [...changes, change],
    },
  );

  return (
    <PendingChangesContext value={pendingChanges}>
      <DispatchContext value={execute}>{children}</DispatchContext>
    </PendingChangesContext>
  );
}

// Consumers fold the pending changes over their own server data.
export function useOptimisticEvents(events: CalendarEvent[]) {
  return use(PendingChangesContext).reduce(eventChangeReducer, events);
}
```

```ts
// The action returns nothing on purpose: confirmed state stays with the Server Component.
export const saveEventChange = actionClient
  .inputSchema(eventChangeSchema)
  .stateAction(async ({ parsedInput }) => {
    await db.events.applyChange(parsedInput);
    // Mandatory here: a fresh currentState is the ONLY thing that can move confirmed state
    // in this shape. Without it the pending list drains onto unchanged data and every saved
    // change visibly reverts.
    revalidatePath("/calendar");
  });
```

The list drains as the queue settles. No explicit rollback is needed: discarding the temporary state **is** the rollback.

This shape still needs `.stateAction()`, even though it ignores `prevResult`. Here `prevResult.data` carries the constant base, not real domain state, so actions in this shape should ignore it.

## Hard Rules

### Always revalidate

When `currentState` comes from revalidated server data, **every action that writes that data must revalidate it** (`revalidatePath` / `revalidateTag`) — including an action that already returns the next state. The returned value only updates this hook; it does not refresh other Server Components or other clients.

Recency is arrival order. If one action revalidates and another does not, the newest payload the page receives can be a snapshot taken _before_ the newest write, and it still wins. The saved change then disappears from the UI while the server keeps it. The tell: `result.data` and `optimisticState` disagree after a save settles.

(A hook whose `currentState` never changes identity — the constant base of Shape 2, or a purely client-held baseline — keeps the action's returned data authoritative without any revalidation. That is the exception, not the default.)

### A `currentState` that arrives mid-queue cuts settled payloads

React holds an optimistic payload only while its own dispatch is pending. This hook keeps every payload alive for the whole queue instead, which is what lets three overlapping moves stay on screen together. It works because the confirmed base does not normally advance until the queue drains: in Next.js the RSC payload of a completed write commits on the same suspended lane the queue waits on, so it lands with everything else.

A `currentState` that commits **while the queue still has work** is the exception: an urgent update, such as a socket push, a `router.refresh()` outside a transition, or a parent re-rendering with a new value. The base then moves under payloads that are still attached, and the ones whose dispatch already settled are already accounted for in the new base.

Those payloads stop folding at that point. The pending ones keep folding, so the change the user is still waiting on stays visible. Nothing is required from you here, but it explains why an external revision arriving mid-queue does not double-count the writes it already carries.

### The queue assumes you are the only writer

Every dispatch sends the client's confirmed state as `prevResult`, and the action writes the next state from it. That is last-write-wins by construction, and it is correct while the user is the only person changing this data.

It is not correct with a second writer (another tab, another user, a background job). When an external change lands while one of your dispatches is in flight:

- The page **shows** it, because a new `currentState` always supersedes the committed result.
- The next queued dispatch does **not** build on it. It builds on what the running action returned, which is what the server held after that write, and the external change was already overwritten there.

The client does not invent that conflict; it reports one the server already resolved in favour of the later write. If losing that change is unacceptable, resolve it on the server: write a delta instead of the whole state, or guard the write with a version column, an `updatedAt` check, or a transaction. No client-side base can fix it, because the client cannot know what reached the server first. If data changes independently of the user often enough to matter, this hook is the wrong tool.

### `currentState` is compared by identity

The hook compares `currentState !== previousCurrentState`. A value with a new identity on every render is read as "the server sent newer data", so confirmed state can never advance past it: the fold drains on every commit and the change appears to revert.

```tsx
const NO_PENDING: EventChange[] = []; // hoisted, stable

useOptimisticStateAction(saveLayout, {
  currentState: groups, // fine: the prop identity is stable
  // currentState: [],                             // new array every render
  // currentState: groups.filter(g => g.visible),  // also new every render
  updateFn: layoutReducer,
});
```

Deriving "before the hook" is not enough on its own — `items.filter(...)` in the parent has the same problem. Memoize it (`useMemo`), or take it from a boundary whose reference is stable until the server revision actually changes. The identity does not have to be stable forever: a genuinely new server snapshot **should** have a new identity, and that is what makes it win.

### `updateFn` must be pure

React replays pending optimistic inputs, so `updateFn` can run many times per change. No side effects, no mutation of the incoming state, no logging that must happen once, no network calls.

### Returned data must fit `State`

When the action returns data, that data must be assignable to `State` (`[Data] extends [State | void]`) — the hook adopts it as the confirmed value and hands it to the next queued dispatch. Narrower compatible data is fine; an unrelated shape (a `{ ok: true }` acknowledgement) is a **compile error**. Actions that return nothing are exempt, which is what Shape 2 relies on.

### `prevResult` handed to the server

`prevResult` always carries a `data` branch: the hook substitutes the last confirmed `State` when a dispatch fails, so one rejected write cannot leave the rest of the queue without a base. Details that matter when writing the action:

- It is the **last confirmed state**, not necessarily the literal result object of the immediately preceding dispatch.
- Validation errors and server errors do not erase it.
- The type is still `SafeActionResult`, so `data` is optional: narrow it or use `prevResult.data!`.
- In Shape 2 it stays the constant base, because the action returns nothing. Ignore it there.
- It is passed through `structuredClone`, so the state must be structured-cloneable (no functions, symbols, or DOM nodes).

### Callbacks fire per dispatch

React withholds `useActionState`'s commit until the whole queue drains, so `result` and `status` cannot report intermediate results. This hook therefore delivers `onExecute`, `onSuccess`, `onError`, `onSettled`, and `onNavigation` **per dispatch**, from the dispatch itself rather than from a render effect.

```tsx
useOptimisticStateAction(saveLayout, {
  currentState: groups,
  updateFn: layoutReducer,
  onError: ({ error, input }) => toast.error(`Could not save ${input.id}`),
});
```

Consequences to design around:

- They fire **before** React commits, where the other hooks' callbacks fire after. Read state from the callback argument, not from the previous render.
- A failed dispatch reports its error while its change is still on screen. With a long queue the callback can run _much_ earlier than the commit that rolls it back, so an error toast can precede the visible rollback by seconds. If that reads as broken, mark the affected rows as failed from `onError` instead of relying on the rollback alone.
- An error thrown inside a callback is logged; it does not reject the dispatch or stop the queue.
- With `throwOnNavigation: true`, navigation callbacks are suppressed (and `onNavigation` / `onSettled` are not even accepted by the types).
- Dispatches made stale by a `reset()` do not fire callbacks against the fresh state.

### Rollback is client-side, and not universal

- **Validation errors and server errors** (including `returnServerError`) settle as results and roll back the optimistic value at commit.
- **Default navigation handling** rolls back too.
- **A raw thrown error does not.** React never commits a result for a rejected Action, so `status` stays `executing` and the optimistic value stays on screen until an error boundary replaces the tree. Do not promise users a visible revert for thrown errors.

A rollback also does not prove the server changed nothing: output validation runs after your server code returns, so a write can land and still surface an error. Durable correctness still needs transactions, idempotency keys, or authoritative revalidation.

## Return Value

Everything [`useStateAction`](./use-state-action.md#return-value) returns (`execute`, `executeAsync`, `formAction`, `input`, `result`, `status`, `reset`, and the `is*` / `has*` shorthands), plus:

| Property          | Type    | Description                                                                                                                                     |
| ----------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `optimisticState` | `State` | Confirmed state folded with every in-flight change. **Always defined** — an error rolls back to the last confirmed value, never to `undefined`. |

Confirmed domain state is tracked separately from the `SafeActionResult` envelope, so a validation or server error rolls back to the last confirmed value instead of blanking the UI.

The `utils` object accepts `currentState`, `updateFn`, the optional `initResult`, and all `HookBaseOptions` (including `throwOnNavigation`) and callbacks.

### `initResult` vs `currentState`

Two different jobs, both captured once at mount:

- `initResult` seeds the **result envelope** (`result.data`, etc.).
- `currentState` seeds the **confirmed domain state** that `optimisticState` folds over.

Never use `initResult.data` as a substitute for `currentState`.

### `formAction`

`formAction` enters the same queue and applies the optimistic update like `execute`, and can interleave with `executeAsync`. It receives raw `FormData`, so the input schema must parse `FormData` (e.g. `zfd.formData({...})` from `zod-form-data`).

### `executeAsync` settlement

- Each queued dispatch resolves with its own result.
- Validation errors and server errors **resolve** with a result; they do not reject.
- Navigation errors **reject** (re-throw them so Next.js can handle the navigation).
- A raw thrown error **rejects**, and can also reject the promises of dispatches queued behind it, because React clears its whole action queue when an Action rejects.
- A raw error from a dispatch already made stale by `reset()` does not cancel fresh queued work.
- A queued dispatch that `reset()` skipped resolves with `{}`: it never reached the server.

### `reset()`

Client-side only:

- Restores the mount-time `currentState` and `initResult`; the next change folds over that restored baseline instead of briefly re-showing the state that was just discarded.
- Reports idle immediately, and masks the pre-reset optimistic and result state.
- Does **not** recall the dispatch already talking to the server: its write lands, and a `revalidatePath` inside it can still push a fresh `currentState`. Its result and callbacks are ignored.
- **Skips** every dispatch still waiting its turn in the queue. Nothing was sent for those yet, so the action never runs and no write happens; their `executeAsync` promises resolve with `{}` and none of their callbacks fire. Running them would write and revalidate _after_ the reset, pulling confirmed state into an order the user already discarded.
- Does **not** undo writes the server already accepted. If the server state must go back too, call an action that resets it (and revalidates).

## Anti-Patterns

```tsx
// BAD: last-write-wins for changes that accumulate — the second move builds on stale state
const { execute, optimisticState } = useOptimisticAction(moveItem, {
  currentState: items,
  updateFn: reorder,
});

// GOOD: queued dispatches, each folding over the confirmed state
const { execute, optimisticState } = useOptimisticStateAction(moveItem, {
  currentState: items,
  updateFn: reorder,
});
```

```tsx
// BAD: derived value as currentState — new identity every render, the fold never accumulates
useOptimisticStateAction(saveLayout, {
  currentState: groups.filter((g) => g.visible),
  updateFn: layoutReducer,
});

// GOOD: memoize, so the identity only changes when the data does
const visibleGroups = useMemo(() => groups.filter((g) => g.visible), [groups]);
useOptimisticStateAction(saveLayout, {
  currentState: visibleGroups,
  updateFn: layoutReducer,
});
```

```ts
// BAD: an action that writes rendered server data but never revalidates —
// a later stale payload wins and silently undoes this write
.stateAction(async ({ parsedInput }, { prevResult }) => {
  const next = reorder(prevResult.data!, parsedInput);
  await db.save(next);
  return next;
});

// GOOD: revalidate too, so arrival order matches write order
.stateAction(async ({ parsedInput }, { prevResult }) => {
  const next = reorder(prevResult.data!, parsedInput);
  await db.save(next);
  revalidatePath("/items");
  return next;
});
```

```ts
// BAD: returning an acknowledgement that isn't the next state — compile error
.stateAction(async ({ parsedInput }) => {
  await db.save(parsedInput);
  revalidatePath("/items");
  return { ok: true }; // not assignable to State
});

// GOOD: return the full next state, or return nothing
.stateAction(async ({ parsedInput }) => {
  await db.save(parsedInput);
  revalidatePath("/items");
});
```

```tsx
// BAD: two hook instances for changes that must build on each other —
// separate queues, separate folds, no shared pending list
function Board({ tasks }) {
  const a = useOptimisticStateAction(moveTask, {
    currentState: tasks,
    updateFn: applyChange,
  });
  const b = useOptimisticStateAction(moveTask, {
    currentState: tasks,
    updateFn: applyChange,
  });
}

// GOOD: one instance in a provider, shared through context
```
