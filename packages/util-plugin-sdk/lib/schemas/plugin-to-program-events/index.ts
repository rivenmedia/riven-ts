import z from "zod";

import { MediaItemPersistMovieIndexerDataEvent } from "./media-item/persist-movie-indexer-data.ts";
import { MediaItemRequestedEvent } from "./media-item/requested.ts";

export const PluginToProgramEvent = z.discriminatedUnion("type", [
  MediaItemRequestedEvent,
  MediaItemPersistMovieIndexerDataEvent,
]);

export type PluginToProgramEvent = z.infer<typeof PluginToProgramEvent>;
