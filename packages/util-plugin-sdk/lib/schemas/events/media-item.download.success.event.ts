import z from "zod";

import { MediaItemInstance } from "../media/media-item-instance.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";

/**
 * Event emitted when a media item has been successfully downloaded.
 */
export const MediaItemDownloadSuccessEvent = createProgramEventSchema(
  "media-item.download.success",
  z.object({
    item: MediaItemInstance,
    downloader: z.string(),
    durationMs: z.number(),
    provider: z.string().nullable(),
    /**
     * Every top-level VFS directory the item is now visible in, always
     * including the built-in root.
     *
     * Library sections mean one item can live at several paths at once, so
     * media servers must refresh all of them or their section libraries go
     * stale. Populated by the core app, which is the only place that can see
     * the section registry.
     *
     * Optional rather than defaulted so that the parsed and unparsed shapes
     * agree, and so consumers must decide what to do when it is absent — as it
     * is for jobs queued by an older version. Falling back to the entry's
     * `baseDirectory` reproduces the pre-sections behaviour.
     *
     * @example ["movies", "horror/movies", "anime-movies"]
     */
    libraryDirectories: z.array(z.string()).optional(),
  }),
);

export type MediaItemDownloadSuccessEvent = z.infer<
  typeof MediaItemDownloadSuccessEvent
>;

export const MediaItemDownloadSuccessEventHandler = createEventHandlerSchema(
  MediaItemDownloadSuccessEvent,
);
