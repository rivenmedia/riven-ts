export const atLeastOnePropertyRequired = <T extends Record<string, unknown>>(
  obj: T,
  fields?: (keyof T)[],
) => {
  const entries = Object.entries(obj);

  for (const [key, value] of entries) {
    if (fields && !fields.includes(key)) {
      continue;
    }

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

  return false;
};
