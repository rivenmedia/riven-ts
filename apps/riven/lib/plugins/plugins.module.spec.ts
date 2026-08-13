import { DataSourceMap } from "@repo/util-plugin-sdk";
import { PluginSettings } from "@repo/util-plugin-sdk/utilities/plugin-settings";

import { Test } from "@nestjs/testing";
import { describe, expect, it as baseIt } from "vitest";

import { AppModule } from "../app.module.ts";
import { logger } from "../utilities/logger/logger.ts";
import { PluginRegistryService } from "./plugins.module.ts";

import type { ValidPluginMap } from "../types/plugins.ts";

const it = baseIt.extend("pluginRegistry", async ({}, { onCleanup }) => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  onCleanup(async () => {
    await module.close();
  });

  return module.get(PluginRegistryService);
});

async function createRegistration() {
  const { plugin: testPlugin } = await import("@repo/plugin-test");

  const plugins: ValidPluginMap = new Map([
    [
      testPlugin.name,
      {
        status: "valid" as const,
        config: testPlugin,
        dataSources: new DataSourceMap(),
      },
    ],
  ]);

  return {
    plugins,
    pluginSettings: new PluginSettings(process.env, [], logger, false),
  };
}

describe("before registration", () => {
  it("reports that no plugins are registered", ({ pluginRegistry }) => {
    expect(pluginRegistry.isRegistered).toBe(false);
  });

  // Reading the registry early would otherwise yield an empty plugin list,
  // silently producing a schema with no plugin resolvers in it.
  it("refuses to be read", ({ pluginRegistry }) => {
    expect(() => pluginRegistry.plugins).toThrow(/have not been registered/u);
  });
});

describe("after registration", () => {
  it("exposes the registered plugins", async ({ pluginRegistry }) => {
    const registration = await createRegistration();

    pluginRegistry.register(registration);

    expect(pluginRegistry.isRegistered).toBe(true);
    expect(pluginRegistry.plugins).toBe(registration.plugins);
    expect(pluginRegistry.pluginSettings).toBe(registration.pluginSettings);
  });

  it("collects the resolvers contributed by each plugin", async ({
    pluginRegistry,
  }) => {
    const registration = await createRegistration();
    const { plugin: testPlugin } = await import("@repo/plugin-test");

    pluginRegistry.register(registration);

    expect(pluginRegistry.resolvers).toStrictEqual([...testPlugin.resolvers]);
  });
});
