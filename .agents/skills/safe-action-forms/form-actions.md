# Native Form Submission Patterns

## Basic Form with useAction

```tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { updateProfile } from "@/app/actions";

export function ProfileForm({ user }: { user: User }) {
  const { execute, result, isPending, hasSucceeded } = useAction(
    updateProfile,
    {
      onSuccess: () => {
        toast.success("Profile updated");
      },
    },
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        execute({
          name: fd.get("name") as string,
          bio: fd.get("bio") as string,
        });
      }}
    >
      <label>
        Name
        <input name="name" defaultValue={user.name} />
        {result.validationErrors?.name?._errors?.map((e) => (
          <span key={e} className="text-red-500 text-sm">
            {e}
          </span>
        ))}
      </label>

      <label>
        Bio
        <textarea name="bio" defaultValue={user.bio ?? ""} />
        {result.validationErrors?.bio?._errors?.map((e) => (
          <span key={e} className="text-red-500 text-sm">
            {e}
          </span>
        ))}
      </label>

      {result.serverError && (
        <div className="text-red-500">{result.serverError}</div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Form with Bind Arguments

Use `.bindArgsSchemas()` to pass arguments that aren't in the form:

```ts
// src/app/actions.ts
"use server";

import { z } from "zod";
import { authActionClient } from "@/lib/safe-action";

export const updatePost = authActionClient
  .bindArgsSchemas([z.string().uuid()]) // postId
  .inputSchema(z.object({ title: z.string(), content: z.string() }))
  .action(async ({ parsedInput, bindArgsParsedInputs: [postId], ctx }) => {
    await db.post.update(postId, parsedInput);
    return { success: true };
  });
```

```tsx
// src/components/edit-post-form.tsx
"use client";

import { useAction } from "next-safe-action/hooks";
import { updatePost } from "@/app/actions";

export function EditPostForm({ post }: { post: Post }) {
  // Bind the postId argument
  const boundAction = updatePost.bind(null, post.id);
  const { execute, isPending } = useAction(boundAction);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        execute({
          title: fd.get("title") as string,
          content: fd.get("content") as string,
        });
      }}
    >
      <input name="title" defaultValue={post.title} />
      <textarea name="content" defaultValue={post.content} />
      <button type="submit" disabled={isPending}>
        Save
      </button>
    </form>
  );
}
```

## Multi-Step Form

Use `executeAsync` for sequential validation:

```tsx
const step1Action = useAction(validateStep1);
const step2Action = useAction(validateStep2);
const submitAction = useAction(submitForm);

const handleNext = async () => {
  if (currentStep === 1) {
    const result = await step1Action.executeAsync(step1Data);
    if (result.data) setCurrentStep(2);
  } else if (currentStep === 2) {
    const result = await step2Action.executeAsync(step2Data);
    if (result.data) setCurrentStep(3);
  }
};

const handleSubmit = async () => {
  await submitAction.executeAsync({ ...step1Data, ...step2Data });
};
```

## Form with useStateAction

`useStateAction` provides a `formAction` dispatcher for `<form action={formAction}>`. The server code receives `prevResult` from the previous execution:

`<form action={formAction}>` submits raw `FormData`, so the schema must parse `FormData`:

```ts
// src/app/actions.ts
"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClient } from "@/lib/safe-action";

export const updateProfile = actionClient
  .inputSchema(
    zfd.formData({
      name: zfd.text(z.string().min(1)),
      bio: zfd.text(z.string()),
    }),
  )
  .stateAction(async ({ parsedInput, ctx }, { prevResult }) => {
    const updated = await db.user.update(ctx.userId, parsedInput);
    return { name: updated.name, updatedAt: new Date().toISOString() };
  });
```

```tsx
// src/components/profile-form.tsx
"use client";

import { useStateAction } from "next-safe-action/hooks";
import { updateProfile } from "@/app/actions";

export function ProfileForm({ user }: { user: User }) {
  const { formAction, result, isPending, hasSucceeded, reset } = useStateAction(
    updateProfile,
    {
      initResult: { data: { name: user.name, updatedAt: "" } },
      onSuccess: () => toast.success("Profile updated"),
    },
  );

  return (
    <form action={formAction}>
      <label>
        Name
        <input name="name" defaultValue={user.name} />
        {result.validationErrors?.name?._errors?.map((e) => (
          <span key={e} className="text-red-500 text-sm">
            {e}
          </span>
        ))}
      </label>

      <label>
        Bio
        <textarea name="bio" defaultValue={user.bio ?? ""} />
      </label>

      {result.serverError && (
        <div className="text-red-500">{result.serverError}</div>
      )}

      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {hasSucceeded && <p>Updated at {result.data?.updatedAt}</p>}
    </form>
  );
}
```

### When to Use useStateAction vs useAction for Forms

|                 | `useAction` + `onSubmit`                 | `useStateAction` + `formAction`                                                                 |
| --------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Form submission | `e.preventDefault()` + manual extract    | Native `<form action={formAction}>`                                                             |
| Previous result | Not available                            | Server receives `prevResult`                                                                    |
| Callbacks       | Full                                     | Full                                                                                            |
| Concurrency     | Executions can overlap (last-write-wins) | Dispatches are queued (each waits for the previous)                                             |
| Best for        | Simple forms, programmatic triggers      | Stateful forms, multi-step wizards, need `prevResult`, writes that must not overtake each other |

Use `useAction` when you don't need `prevResult` and prefer manual form handling. Use `useStateAction` when you want the `<form action={...}>` pattern with full lifecycle callbacks, `prevResult` access, or serialized writes. For instant UI on top of those queued writes, use [`useOptimisticStateAction`](../safe-action-hooks/use-optimistic-state-action.md).

## Displaying Validation Errors

The default validation error shape is nested with `_errors`:

```ts
// For schema: z.object({ email: z.string().email(), name: z.string().min(2) })
// result.validationErrors might be:
{
  email: { _errors: ["Invalid email address"] },
  name: { _errors: ["String must contain at least 2 character(s)"] },
}
```

Helper component for displaying errors:

```tsx
function FieldError({ errors }: { errors?: { _errors?: string[] } }) {
  if (!errors?._errors?.length) return null;
  return (
    <div className="text-red-500 text-sm mt-1">
      {errors._errors.map((e, i) => (
        <p key={i}>{e}</p>
      ))}
    </div>
  );
}

// Usage:
<FieldError errors={result.validationErrors?.email} />;
```
