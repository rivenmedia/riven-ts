/**
 * Whether the error was caused by the Next.js cookie store being unavailable,
 * e.g. when called outside of a request scope.
 */
export function isUnavailableCookieStoreError(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.startsWith(
      "`cookies` was called outside a request scope.",
    ) ||
      error.message.includes("Cannot find module"))
  );
}
