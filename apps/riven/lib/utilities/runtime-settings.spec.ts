import { expect, it, vi } from "vitest";

it("rejects access to the runtime settings before they are loaded", async () => {
  vi.resetModules();

  const { getRuntimeSettings } = await import("./runtime-settings.ts");

  expect(() => getRuntimeSettings()).toThrow(
    "Runtime settings accessed before they were loaded",
  );
});
