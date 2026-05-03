import { createPluginSettings } from "@rivenmedia/plugin-sdk/utilities/create-plugin-settings-schema";
import { z } from "@rivenmedia/plugin-sdk/validation";

export const TestSettings = createPluginSettings({});

export type TestSettings = z.infer<typeof TestSettings>;
