import { type } from "arktype";

import { DebridFile } from "../torrents/debrid-file.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a download has been requested for an scraped media item.
 */
export const MediaItemDownloadRequestedEvent = createProgramEventSchema(
  "media-item.download.requested",
  type({
    infoHash: "string.hex == 40",
    provider: "string | null",
  }),
);

export type MediaItemDownloadRequestedEvent =
  typeof MediaItemDownloadRequestedEvent.infer;

export const MediaItemDownloadRequestedResponse = type({
  torrentId: "string > 0",
  files: DebridFile.array(), // TODO: min 1
});

export type MediaItemDownloadRequestedResponse =
  typeof MediaItemDownloadRequestedResponse.infer;

export const MediaItemDownloadRequestedEventHandler = createEventHandlerSchema(
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
);
