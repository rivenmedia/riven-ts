import { z } from "@rivenmedia/plugin-sdk/validation";

export const NotificationScheme = z.enum(["discord", "json", "jsons"]);

export type NotificationScheme = z.infer<typeof NotificationScheme>;
