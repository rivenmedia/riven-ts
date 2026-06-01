import { type MediaItem, Show } from "@repo/util-plugin-sdk/dto/entities";

import type { RivenSettings } from "../../../../riven-settings.schema.ts";

/**
 * Decide whether an item should be fanned out to its incomplete children when
 * it is picked up for processing (rather than processed as a single unit).
 *
 * - Any partial request always fans out (only the requested subset exists).
 * - A Show fans out to its seasons when it is `continuing`, when
 *   `preferSeasonPacks` is set, OR whenever the NZB strategy is active: a
 *   show-level Newznab tvsearch returns the entire series feed (which can't be
 *   downloaded as one release), so NZB always descends to per-season scrapes.
 * - Everything else (movies, and seasons/episodes — which are scraped directly)
 *   is processed as-is.
 */
export function shouldFanOutForProcessing(params: {
  item: MediaItem;
  isPartialRequest: boolean;
  downloadStrategy: RivenSettings["downloadStrategy"];
  preferSeasonPacks: boolean;
}): boolean {
  const { item, isPartialRequest, downloadStrategy, preferSeasonPacks } =
    params;

  if (isPartialRequest) {
    return true;
  }

  if (item instanceof Show) {
    return (
      item.status === "continuing" ||
      preferSeasonPacks ||
      downloadStrategy === "nzb"
    );
  }

  return false;
}
