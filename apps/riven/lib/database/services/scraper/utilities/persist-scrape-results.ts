import { Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";

import { validateOrReject } from "class-validator";

import { getValidationErrorMessage } from "#database/services/core/utilities/get-validation-error-message.ts";

import type { EntityManager } from "@mikro-orm/core";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { ParsedData } from "@repo/util-rank-torrent-name";

export async function persistScrapeResults(
  em: EntityManager,
  item: MediaItem,
  results: Record<string, ParsedData>,
) {
  const streams = await em.upsertMany(
    Stream,
    Object.entries(results).map(([infoHash, parsedData]) => ({
      infoHash,
      parsedData,
    })),
    { onConflictAction: "ignore" },
  );

  const newStreamsCount = item.streams.add(streams);

  try {
    await validateOrReject(item);
  } catch (error) {
    throw new MediaItemScrapeError({
      item,
      error: getValidationErrorMessage(error),
    });
  }

  return newStreamsCount;
}
