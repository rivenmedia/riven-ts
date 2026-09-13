import { createMockPluginSettings } from "@repo/util-plugin-testing/create-mock-plugin-settings";

import { StremThruSettings } from "../stremthru-settings.schema.ts";
import { it as baseIt } from "./stremthru.test-context.ts";

/**
 * Test context configured with a premiumize API key, for exercising
 * direct-link stores (which need no link/generate resolution).
 */
export const it = baseIt.override(
  "settings",
  createMockPluginSettings(StremThruSettings, {
    realdebridApiKey: "test-realdebrid-api-key",
    premiumizeApiKey: "test-premiumize-api-key",
  }),
);
