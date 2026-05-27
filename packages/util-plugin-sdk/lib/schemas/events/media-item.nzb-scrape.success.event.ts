import z from "zod";

import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Event emitted when an NZB scrape has completed successfully.
 * Carries a count of candidates found so downstream workers can decide
 * whether to proceed to download or emit a no-new-streams error.
 */
export const MediaItemNzbScrapeSuccessEvent = createProgramEventSchema(
  "media-item.nzb-scrape.success",
  z.object({
    itemId: UUID,
    candidateCount: z.number().int().nonnegative(),
  }),
);

export type MediaItemNzbScrapeSuccessEvent = z.infer<
  typeof MediaItemNzbScrapeSuccessEvent
>;

/** Handler for the nzb-scrape.success event. No response value (fire-and-forget). */
export const MediaItemNzbScrapeSuccessEventHandler = createEventHandlerSchema(
  MediaItemNzbScrapeSuccessEvent,
);
