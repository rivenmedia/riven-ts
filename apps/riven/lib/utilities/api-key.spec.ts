import { expect, it } from "vitest";

import { isGeneratedApiKey, resolveApiKey } from "./api-key.ts";

it("resolveApiKey gives worker threads the key that the main thread generated", () => {
  const mainThreadKey = resolveApiKey(undefined, true);

  expect(resolveApiKey(undefined, false)).toBe(mainThreadKey);
});

it("resolveApiKey generates a key as long as a configured key must be", () => {
  expect(resolveApiKey(undefined, true).length).toBeGreaterThanOrEqual(32);
});

it("isGeneratedApiKey is true only for the key the main thread generated", () => {
  expect(isGeneratedApiKey(resolveApiKey(undefined, true))).toBe(true);
  expect(isGeneratedApiKey(resolveApiKey("k".repeat(32), true))).toBe(false);
});
