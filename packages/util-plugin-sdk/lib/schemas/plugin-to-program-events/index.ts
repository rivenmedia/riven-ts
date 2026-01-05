import z from "zod";

import { MediaItemRequestedEvent } from "./media-item/requested.ts";

export const PluginToProgramEvent = z.discriminatedUnion("type", [
  MediaItemRequestedEvent,
]);

export type PluginToProgramEvent = z.infer<typeof PluginToProgramEvent>;
