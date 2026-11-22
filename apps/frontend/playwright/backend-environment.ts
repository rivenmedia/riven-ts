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
 * It's meant to be the `ORIGIN` environment variable, but that never reaches the browser bundle, so the client falls
 * back to the schema's default. The integrated suite re-addresses it to the worker's Riven too.
 */
// oxlint-disable-next-line sonarjs/no-clear-text-protocols -- never resolves in the tests
export const browserAuthOrigin = "https://localhost:9000";
