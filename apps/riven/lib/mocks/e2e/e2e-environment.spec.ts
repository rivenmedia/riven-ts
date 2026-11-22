import { expect, it } from "vitest";

import { CorePlugins } from "#schemas/core-plugins.schema.ts";

import { createE2eEnvironment } from "./e2e-environment.ts";

const input = {
  port: 9200,
  databaseUrl: "postgres://riven:riven@localhost:5432/riven_e2e_0",
  redisUrl: "redis://localhost:6379",
  vfsMountPath: "/var/lib/riven-e2e-0",
  apiKey: "e2e-api-key-0123456789abcdef0123456789",
  origin: "http://localhost:9000",
};

it("enables every core plugin", () => {
  const environment = createE2eEnvironment(input);

  expect(
    JSON.parse(environment["RIVEN_SETTING__enabledPlugins"] ?? ""),
  ).toStrictEqual(CorePlugins.options);
});

it("only points external services at .invalid hosts", () => {
  const allowed = new Set([input.databaseUrl, input.redisUrl, input.origin]);
  const hostnames = Object.values(createE2eEnvironment(input))
    .filter((value) => URL.canParse(value) && !allowed.has(value))
    .map((value) => new URL(value).hostname);

  expect(hostnames.length).toBeGreaterThan(0);
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
