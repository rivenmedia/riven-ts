---
name: safe-action-forms
description: Use when integrating next-safe-action with forms -- react-hook-form adapter (useHookFormAction, useHookFormOptimisticAction, mapToHookFormErrors), native HTML forms, bind arguments, or file uploads
---

# next-safe-action Form Integration

## Options

| Approach                                        | When to Use                                                                                                                                    |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `useAction` + native form                       | Simple forms, no complex validation UI, programmatic triggers                                                                                  |
| `useStateAction` + `<form action={formAction}>` | Forms with state tracking, need `prevResult` access, full callbacks                                                                            |
| `useHookFormAction` (RHF adapter)               | Complex forms with field-level errors, validation on change/blur                                                                               |
| `useHookFormOptimisticAction`                   | RHF forms with optimistic UI updates                                                                                                           |
| `useOptimisticStateAction`                      | Instant UI where overlapping writes must be queued and accumulate (see the [hooks skill](../safe-action-hooks/use-optimistic-state-action.md)) |

## Quick Start — useStateAction Form

```tsx
"use client";

import { useStateAction } from "next-safe-action/hooks";
import { submitContact } from "@/app/actions";

export function ContactForm() {
  const { formAction, result, isPending, hasSucceeded } = useStateAction(
    submitContact,
    {
      onSuccess: () => toast.success("Message sent!"),
    },
  );

  return (
    <form action={formAction}>
      <input name="name" required />
      <input name="email" type="email" required />
      <textarea name="message" required />

      {result.validationErrors?.email && (
        <p>{result.validationErrors.email._errors?.[0]}</p>
      )}
      {result.serverError && <p>{result.serverError}</p>}
      {hasSucceeded && <p>Message sent!</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

Note: `useStateAction` requires the server action to be defined with `.stateAction()` instead of `.action()`, and `<form action={formAction}>` passes raw `FormData`, so its input schema must parse `FormData` (e.g. `zfd.formData({...})` from `zod-form-data`). See the [hooks skill](../safe-action-hooks/use-state-action.md) for the full decision table on when to use `useAction` vs `useStateAction`.

## Quick Start — Native Form

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { submitContact } from "@/app/actions";

export function ContactForm() {
  const { execute, result, isPending } = useAction(submitContact);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        execute({
          name: fd.get("name") as string,
          email: fd.get("email") as string,
          message: fd.get("message") as string,
        });
      }}
    >
      <input name="name" required />
      <input name="email" type="email" required />
      <textarea name="message" required />

      {result.validationErrors && (
        <p>{result.validationErrors.email?._errors?.[0]}</p>
      )}
      {result.serverError && <p>{result.serverError}</p>}
      {result.data && <p>Message sent!</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

## Quick Start — React Hook Form Adapter

```tsx
"use client";

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { submitContact } from "@/app/actions";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export function ContactForm() {
  const { form, handleSubmitWithAction, action } = useHookFormAction(
    submitContact,
    zodResolver(schema),
    {
      actionProps: {
        onSuccess: () => toast.success("Message sent!"),
      },
    },
  );

  return (
    <form onSubmit={handleSubmitWithAction}>
      <input {...form.register("name")} />
      {form.formState.errors.name && (
        <p>{form.formState.errors.name.message}</p>
      )}

      <input {...form.register("email")} />
      {form.formState.errors.email && (
        <p>{form.formState.errors.email.message}</p>
      )}

      <textarea {...form.register("message")} />
      {form.formState.errors.message && (
        <p>{form.formState.errors.message.message}</p>
      )}

      {action.result.serverError && <p>{action.result.serverError}</p>}

      <button type="submit" disabled={action.isPending}>
        {action.isPending ? "Sending..." : "Send"}
      </button>
    </form>
  );
}
```

## Supporting Docs

- [Native form submission patterns](./form-actions.md)
- [React Hook Form adapter in depth](./react-hook-form.md)
- [File uploads](./file-uploads.md)

## Entry Points

| Package                                           | Entry Point | Exports                                                                            |
| ------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------- |
| `@next-safe-action/adapter-react-hook-form`       | Default     | `mapToHookFormErrors`, types                                                       |
| `@next-safe-action/adapter-react-hook-form/hooks` | Hooks       | `useHookFormAction`, `useHookFormOptimisticAction`, `useHookFormActionErrorMapper` |
