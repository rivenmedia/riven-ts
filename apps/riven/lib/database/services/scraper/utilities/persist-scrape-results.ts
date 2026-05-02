import { MediaItem, Stream } from "@rivenmedia/plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@rivenmedia/plugin-sdk/schemas/events/media-item.scrape.error.event";

import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { EntityManager } from "@mikro-orm/core";
import type { ParsedData } from "@repo/util-rank-torrent-name";

export async function persistScrapeResults(
  em: EntityManager,
  item: MediaItem,
  results: Record<string, ParsedData>,
) {
  const streams = await em.upsertMany(
    Stream,
    Object.entries(results).map(([infoHash, parsedData]) =>
      em.create(Stream, {
        infoHash,
        parsedData,
      }),
    ),
    { onConflictAction: "ignore" },
  );

  const newStreamsCount = item.streams.add(streams);

  try {
    await validateOrReject(item);
  } catch (error) {
    const errorMessage = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .transform((error) => {
        if (Array.isArray(error)) {
          return error
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ");
        }

        return error.message;
      })
      .parse(error);

    throw new MediaItemScrapeError({
      item,
      error: errorMessage,
    });
  }

  return newStreamsCount;
}
