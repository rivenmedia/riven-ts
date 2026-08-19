import { RivenTuiSettingsSchema } from "./riven-tui-settings.schema.ts";

export const settings = RivenTuiSettingsSchema.parse(process.env);
