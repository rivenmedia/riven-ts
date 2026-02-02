import z from "zod";

import { MediaItem } from "../media/media-item.ts";
import { TorrentContainer } from "../torrents/torrent-container.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a download has been requested for an scraped media item.
 */
export const MediaItemDownloadRequestedEvent = createProgramEventSchema(
  "media-item.download.requested",
  z.object({
    item: MediaItem,
  }),
);

export type MediaItemDownloadRequestedEvent = z.infer<
  typeof MediaItemDownloadRequestedEvent
>;

export const MediaItemDownloadRequestedResponse = TorrentContainer;

export type MediaItemDownloadRequestedResponse = z.infer<
  typeof MediaItemDownloadRequestedResponse
>;

export const MediaItemDownloadRequestedEventHandler = createEventHandlerSchema(
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
);
