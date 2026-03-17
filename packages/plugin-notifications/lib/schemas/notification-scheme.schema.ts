import z from "zod";

export const NotificationScheme = z.enum(["discord", "json", "jsons"]);

export type NotificationScheme = z.infer<typeof NotificationScheme>;
