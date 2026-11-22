/**
 * The backend the Next.js server is pointed at during the tests.
 *
 * It never resolves, so a request that a test doesn't mock or re-address to its Riven fails, rather than reaching a
 * local Riven.
 */
// oxlint-disable-next-line sonarjs/no-clear-text-protocols -- `.invalid` hosts never resolve
export const backendUrl = "http://riven.e2e.invalid";

/** The API key shared `"use cache"` queries authenticate with. Every E2E Riven accepts it. */
export const backendApiKey = "e2e-backend-api-key-0123456789abcdef";

/**
 * The origin the browser's auth client sends its requests to.
 *
 * Workaround for a known frontend production bug: the browser auth client's `baseURL` is `ORIGIN`, which isn't a
 * `NEXT_PUBLIC_` variable, so it never reaches the browser bundle and the client always falls back to the schema's
 * default. The integrated suite re-addresses this origin to the worker's Riven too. Remove it once the client uses
 * the page's own origin.
 */
export const browserAuthOrigin = "https://localhost:9000";
