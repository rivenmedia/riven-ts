import { SPLAT } from "triple-beam";
import { expect, it } from "vitest";
import z from "zod";

import { validationErrorMetaFormat } from "./validation-error-meta.format.ts";

import type { TransformableInfo } from "logform";

const { error: validationError } = z
  .object({ name: z.string() })
  .safeParse({ name: 42 });

const transform = (splat?: unknown[]) =>
  validationErrorMetaFormat().transform({
    level: "error",
    message: "Validation failed",
    ...(splat && { [SPLAT]: splat }),
  } as TransformableInfo);

it.for([
  { label: "an error metadata object", splat: [{ err: validationError }] },
  { label: "the error itself", splat: [validationError] },
])(
  "adds the prettified validation message when logging $label",
  ({ splat }) => {
    expect(transform(splat)).toMatchObject({
      "riven.error.validation-message": z.prettifyError(
        validationError as z.ZodError,
      ),
    });
  },
);

it.for([
  { label: "without metadata", splat: undefined },
  { label: "with a non-validation error", splat: [new Error("Boom")] },
  { label: "with unrelated metadata", splat: [{ count: 1 }] },
])("leaves the log entry unchanged $label", ({ splat }) => {
  expect(transform(splat)).not.toHaveProperty("riven.error.validation-message");
  expect(transform(splat)).toMatchObject({ message: "Validation failed" });
});
