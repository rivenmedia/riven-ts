import type { Traversal } from "arktype";

export const recordIsNotEmpty = (
  obj: Record<string, unknown>,
  ctx: Traversal,
) => {
  const isValid = Object.keys(obj).length > 0;

  if (!isValid) {
    return ctx.reject("Record must not be empty");
  }

  return true;
};
