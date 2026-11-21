import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { expect } from "vitest";

import { it } from "../__tests__/stremthru.test-context.ts";
import { StremThruSettings } from "../stremthru-settings.schema.ts";
import { StremThruTorzAPI } from "./stremthru-torz.datasource.ts";

it.override("settings", createMockPluginSettings(StremThruSettings, {}));

it("returns false when no stores are configured", async ({ dataSourceMap }) => {
  const api = dataSourceMap.get(StremThruTorzAPI);
  const isValid = await api.validate();

  expect(isValid).toBe(false);
});
