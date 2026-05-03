import z from "zod";

export const BasePluginSettings = z.object({
  enabled: z
    .stringbool()
    .default(true)
    .describe("Whether the plugin is enabled or not."),
});

export type BasePluginSettings = z.infer<typeof BasePluginSettings>;
