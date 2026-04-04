import { type } from "arktype";

export const NotificationScheme = type.enumerated("discord", "json", "jsons");

export type NotificationScheme = typeof NotificationScheme.infer;
