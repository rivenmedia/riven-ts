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

// Private ranges, as the proxies on a Docker network would use
// oxlint-disable sonarjs/no-hardcoded-ip
it("parses the trusted proxies from a JSON array", async () => {
  vi.resetModules();
  vi.stubEnv(
    "RIVEN_FRONTEND_SETTING__trustedProxies",
    '["172.16.0.0/12", "10.0.0.1", "fd00::/8"]',
  );

  const { frontendSettings } = await import("./frontend-settings.ts");

  expect(frontendSettings.trustedProxies).toStrictEqual([
    "172.16.0.0/12",
    "10.0.0.1",
    "fd00::/8",
  ]);
});
// oxlint-enable sonarjs/no-hardcoded-ip

it("trusts no proxies by default", async () => {
  vi.resetModules();

  const { frontendSettings } = await import("./frontend-settings.ts");

  expect(frontendSettings.trustedProxies).toStrictEqual([]);
});

it("rejects trusted proxies that aren't IP addresses or CIDR ranges", async () => {
  vi.resetModules();
  vi.stubEnv("RIVEN_FRONTEND_SETTING__trustedProxies", '["riven-frontend"]');

  await expect(import("./frontend-settings.ts")).rejects.toThrow(
    /trustedProxies/u,
  );
});
