/**
 * Whether a value should be considered "present" for the purposes of `atLeastOnePropertyRequired`.
 *
 * Nullish values, blank strings, zero and empty arrays are all considered empty.
 */
const hasValue = (value: unknown) => {
  if (value == null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim() !== "";
  }

  if (typeof value === "number") {
    return value !== 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return true;
};

export const atLeastOnePropertyRequired = <T extends Record<string, unknown>>(
  obj: T,
  fields?: (keyof T)[],
) =>
  Object.entries(obj).some(
    ([key, value]) => (!fields || fields.includes(key)) && hasValue(value),
  );
