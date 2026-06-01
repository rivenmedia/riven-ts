import z from "zod";

import { MediaItemType } from "../../dto/enums/media-item-type.enum.ts";
import { createEventHandlerSchema } from "../utilities/create-event-handler-schema.ts";
import { createProgramEventSchema } from "../utilities/create-program-event-schema.ts";
import { UUID } from "../utilities/uuid.schema.ts";

/**
 * Minimal serialisable representation of a media item carried in NZB scrape events.
 * Using a plain-data schema (not z.instanceof) so the event is safe to send over
 * any serialisation boundary (BullMQ, HTTP, etc.).
 */
export const NzbScrapeMediaItemPayload = z.object({
  id: UUID,
  title: z.string().min(1),
  imdbId: z
    .string()
    .regex(/^tt\d+$/)
    .nullable()
    .optional(),
  /**
   * TheTVDB series ID for show/season/episode scrapes. Newznab `tvsearch` keys
   * on `tvdbid` (NOT `imdbid`, which silently returns zero results), so this is
   * the primary identifier for TV. Always the parent SHOW's id (the series),
   * paired with seasonNumber/episodeNumber. Undefined/null for movies.
   */
  tvdbId: z.string().min(1).nullable().optional(),
  type: MediaItemType,
  /**
   * Season number for show/season/episode-level scrapes.
   * Undefined for movies; required at the indexer layer so tvsearch returns
   * the correct season instead of the full series feed.
   */
  seasonNumber: z.number().int().nonnegative().nullable().optional(),
  /**
   * Episode number for episode-level scrapes.
   * Undefined for movies, shows, and season-level scrapes.
   */
  episodeNumber: z.number().int().nonnegative().nullable().optional(),
});

export type NzbScrapeMediaItemPayload = z.infer<
  typeof NzbScrapeMediaItemPayload
>;

/**
 * A single NZB candidate returned by a Usenet indexer plugin.
 */
export const NzbCandidate = z.object({
  url: z.url(),
  title: z.string().min(1),
  size: z.number().int().nonnegative(),
  category: z.string(),
  // Accepts HH:MM, HH:MM:SS, and HH:MM:SS.fff — covers all Newznab/Torznab
  // pubDate formats emitted by real indexers (which are always at least
  // second-precision). Don't tighten to precision: -1 like ReleaseDatetime;
  // this is external indexer data, not internal canonical data.
  publishDate: z.iso.datetime(),
  indexer: z.string(),
});

export type NzbCandidate = z.infer<typeof NzbCandidate>;

/**
 * Event emitted when an NZB scrape has been requested for an indexed media item.
 * Used by the altmount/NZB pipeline to hand off media items to Usenet indexer plugins.
 */
export const MediaItemNzbScrapeRequestedEvent = createProgramEventSchema(
  "media-item.nzb-scrape.requested",
  z.object({
    item: NzbScrapeMediaItemPayload,
  }),
);

export type MediaItemNzbScrapeRequestedEvent = z.infer<
  typeof MediaItemNzbScrapeRequestedEvent
>;

export const MediaItemNzbScrapeRequestedResponse = z.object({
  // An empty candidates array is intentionally valid: zero results from an indexer
  // is a normal pipeline outcome handled downstream as a "no-new-streams" error
  // event, not a schema-level validation failure.
  candidates: z.array(NzbCandidate),
});

export type MediaItemNzbScrapeRequestedResponse = z.infer<
  typeof MediaItemNzbScrapeRequestedResponse
>;

export const MediaItemNzbScrapeRequestedEventHandler = createEventHandlerSchema(
  MediaItemNzbScrapeRequestedEvent,
  MediaItemNzbScrapeRequestedResponse,
);
