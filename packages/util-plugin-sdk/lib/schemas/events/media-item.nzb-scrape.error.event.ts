import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Event emitted when an NZB scrape attempt has failed.
 * `reason` classifies the failure so downstream workers can route accordingly:
 *   - "no-new-streams"   — indexer(s) returned zero usable candidates
 *   - "indexer-error"    — one or more indexers returned a transport/protocol error
 *   - "incorrect-state"  — the media item is in a state that cannot be NZB-scraped
 * `detail` is an optional human-readable message for logging / alerting.
 */
export const MediaItemNzbScrapeErrorEvent = createProgramEventSchema(
  "media-item.nzb-scrape.error",
  z.object({
    itemId: UUID,
    reason: z.enum(["no-new-streams", "indexer-error", "incorrect-state"]),
    detail: z.string().optional(),
  }),
);

export type MediaItemNzbScrapeErrorEvent = z.infer<
  typeof MediaItemNzbScrapeErrorEvent
>;

/** Handler for the nzb-scrape.error event. No response value (fire-and-forget). */
export const MediaItemNzbScrapeErrorEventHandler = createEventHandlerSchema(
  MediaItemNzbScrapeErrorEvent,
);
