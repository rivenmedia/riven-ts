import { expect, it } from "vitest";

import { resolveApiKey } from "./api-key.ts";

it("resolveApiKey uses the configured key in every thread", () => {
  const configuredKey = "k".repeat(32);

  expect(resolveApiKey(configuredKey, true)).toBe(configuredKey);
  expect(resolveApiKey(configuredKey, false)).toBe(configuredKey);
});

it("resolveApiKey gives worker threads the key that the main thread generated", () => {
  const mainThreadKey = resolveApiKey(undefined, true);

  expect(resolveApiKey(undefined, false)).toBe(mainThreadKey);
});

it("resolveApiKey generates a key as long as a configured key must be", () => {
  expect(resolveApiKey(undefined, true).length).toBeGreaterThanOrEqual(32);
});
