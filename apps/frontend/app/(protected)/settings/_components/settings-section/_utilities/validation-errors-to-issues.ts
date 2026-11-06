/**
 * Flattens next-safe-action's formatted validation errors back into settings
 * issues with dotted paths. Messages on the root get an empty path.
 */
export function validationErrorsToIssues(
  validationErrors: object | undefined,
  path = "",
): { path: string; message: string }[] {
  if (!validationErrors) {
    return [];
  }

  return Object.entries(validationErrors).flatMap(
    ([key, value]: [string, unknown]) => {
      // `_errors` is next-safe-action's key for a node's own messages
      if (key === "_errors" && Array.isArray(value)) {
        return value.map((message) => ({ path, message: String(message) }));
      }

      if (typeof value === "object" && value !== null) {
        return validationErrorsToIssues(value, path ? `${path}.${key}` : key);
      }

      return [];
    },
  );
}
