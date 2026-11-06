import z from "zod";

import { CorePlugins } from "#schemas/core-plugins.schema.ts";

export const PluginsSettings = z.object({
  enabledPlugins: z
    .array(CorePlugins)
    .default([])
    .describe("A list of core plugins to enable."),
});

export type PluginsSettings = z.infer<typeof PluginsSettings>;
