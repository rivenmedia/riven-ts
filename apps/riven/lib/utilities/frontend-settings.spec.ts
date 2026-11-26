import { expect, it, vi } from "vitest";

it("reads the frontend settings from the environment and removes them", async () => {
  vi.resetModules();
  vi.stubEnv("RIVEN_FRONTEND_SETTING__origin", "https://riven.example.com");
  vi.stubEnv("RIVEN_FRONTEND_SETTING__disablePlex", "true");
  vi.stubEnv("RIVEN_FRONTEND_SETTING__passkeyRpName", "");

  const { frontendSettings } = await import("./frontend-settings.ts");

  expect(frontendSettings).toMatchObject({
    origin: "https://riven.example.com",
    disablePlex: true,
    passkeyRpId: "localhost",
  });
  expect(frontendSettings.passkeyRpName).toBeUndefined();

  expect(process.env).not.toHaveProperty("RIVEN_FRONTEND_SETTING__origin");
  expect(process.env).not.toHaveProperty("RIVEN_FRONTEND_SETTING__disablePlex");
  // Empty settings are ignored, so they stay in the environment
  expect(process.env).toHaveProperty("RIVEN_FRONTEND_SETTING__passkeyRpName");
});

it("freezes the frontend settings", async () => {
  vi.resetModules();

  const { frontendSettings } = await import("./frontend-settings.ts");

  expect(Object.isFrozen(frontendSettings)).toBe(true);
});
