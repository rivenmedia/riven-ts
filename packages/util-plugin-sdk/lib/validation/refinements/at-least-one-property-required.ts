import type { Traversal } from "arktype";

export const atLeastOnePropertyRequired = (
  obj: Record<string, unknown>,
  ctx: Traversal,
) => {
  const values = Object.values(obj);

  for (const value of values) {
    if (value != null) {
      if (typeof value === "string" && value.trim() === "") {
        continue;
      }

      if (typeof value === "number" && value === 0) {
        continue;
      }

      if (Array.isArray(value) && value.length === 0) {
        continue;
      }

      return true;
    }
  }

  return ctx.reject("At least one property is required");
};
