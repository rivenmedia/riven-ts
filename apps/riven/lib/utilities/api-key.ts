import assert from "node:assert";
import { randomBytes } from "node:crypto";
import { getEnvironmentData, setEnvironmentData } from "node:worker_threads";

const ENVIRONMENT_DATA_KEY = "generatedApiKey";

/**
 * Returns the configured API key, or else the key the main thread generated.
 *
 * Worker threads copy the main thread's environment data when they start,
 * so every thread sends and accepts the same generated key.
 */
export function resolveApiKey(
  configured: string | undefined,
  isMainThread: boolean,
) {
  if (configured !== undefined) {
    return configured;
  }

  const shared = getEnvironmentData(ENVIRONMENT_DATA_KEY);

  if (typeof shared === "string") {
    return shared;
  }

  assert.ok(
    isMainThread,
    "A worker thread started before the main thread generated the API key",
  );

  const generated = randomBytes(32).toString("base64url");

  setEnvironmentData(ENVIRONMENT_DATA_KEY, generated);

  return generated;
}
