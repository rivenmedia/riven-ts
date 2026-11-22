import { expect, it } from "vitest";

import { createE2eEnvironment } from "./e2e-environment.ts";

const input = {
  port: 9200,
  databaseUrl: "postgres://riven:riven@localhost:5432/riven_e2e_0",
  redisUrl: "redis://localhost:6379",
  vfsMountPath: "/var/lib/riven-e2e-0",
  apiKey: "e2e-api-key-0123456789abcdef0123456789",
  origin: "http://localhost:9000",
  enabledPlugins: ["comet", "seerr"],
};

it("enables the plugins it is given", () => {
  const environment = createE2eEnvironment(input);

  expect(
    JSON.parse(environment["RIVEN_SETTING__enabledPlugins"] ?? ""),
  ).toStrictEqual(input.enabledPlugins);
});

/** Every URL in the environment, including those inside JSON-array values such as the notifications `urls` */
function collectUrls(value: string): string[] {
  if (URL.canParse(value)) {
    return [value];
  }

  try {
    const parsed: unknown = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string").flatMap(collectUrls)
      : [];
  } catch {
    return [];
  }
}

it("only points external services at .invalid hosts", () => {
  const allowed = new Set([input.databaseUrl, input.redisUrl, input.origin]);
  const urls = Object.values(createE2eEnvironment(input))
    .flatMap(collectUrls)
    .filter((url) => !allowed.has(url));
  const hostnames = urls.map((url) => new URL(url).hostname);

  expect(urls).toContain("json://notifications.e2e.invalid/hook");
  expect(
    hostnames.filter((hostname) => !hostname.endsWith(".invalid")),
  ).toStrictEqual([]);
});

it("runs in test mode with the baseline scenario", () => {
  expect(createE2eEnvironment(input)).toMatchObject({
    NODE_ENV: "test",
    MOCK_SCENARIO: "e2e-baseline",
    RIVEN_SETTING__port: "9200",
    RIVEN_SETTING__apiKey: input.apiKey,
  });
});

it("keeps the legacy ranking config import away from real files", () => {
  const environment = createE2eEnvironment(input);

  expect(environment["RIVEN_SETTING__rankingConfigPath"]).toBe(
    "/var/lib/riven-e2e-0.ranking-config.json",
  );
});

it("only logs to the console, outside the repo's log directory", () => {
  expect(createE2eEnvironment(input)).toMatchObject({
    RIVEN_SETTING__enabledLogTransports: JSON.stringify(["console"]),
    RIVEN_SETTING__logDirectory: "/var/lib/riven-e2e-0.logs",
  });
});
