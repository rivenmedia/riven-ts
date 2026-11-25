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
