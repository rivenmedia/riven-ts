import { createE2eEnvironment } from "@repo/util-e2e";

import { expect, it } from "vitest";

import { CorePlugins } from "#schemas/core-plugins.schema.ts";

it("the E2E environment enables every core plugin", () => {
  const environment = createE2eEnvironment({
    port: 9200,
    databaseUrl: "postgres://riven:riven@localhost:5432/riven_e2e_0",
    redisUrl: "redis://localhost:6379",
    vfsMountPath: "/var/lib/riven-e2e-0",
    apiKey: "e2e-api-key-0123456789abcdef0123456789",
    origin: "http://localhost:9000",
    enabledPlugins: CorePlugins.options,
  });

  expect(
    JSON.parse(environment["RIVEN_SETTING__enabledPlugins"] ?? ""),
  ).toStrictEqual(CorePlugins.options);
});
