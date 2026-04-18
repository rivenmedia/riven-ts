import { MediaItem, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";

import { type EntityManager, ref } from "@mikro-orm/core";
import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import type { ParsedData } from "@repo/util-rank-torrent-name";

export async function persistScrapeResults(
  em: EntityManager,
  item: MediaItem,
  results: Record<string, ParsedData>,
) {
  const streamsCount = item.streams.count();

  const infoHashes = Object.keys(results);
  const preScrapedStreams = await em.getRepository(Stream).find({
    infoHash: { $in: infoHashes },
  });

  const preScrapedStreamsMap = new Map(
    preScrapedStreams.map((stream) => [stream.infoHash, stream]),
  );

  for (const [infoHash, parsedData] of Object.entries(results)) {
    const existingEntry = preScrapedStreamsMap.get(infoHash);
    const stream = existingEntry ?? em.create(Stream, { infoHash, parsedData });

    item.streams.add(ref(stream));
  }

  const newStreamsCount = item.streams.count() - streamsCount;

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

  if (newStreamsCount === 0) {
    throw new MediaItemScrapeErrorNoNewStreams({ item });
  }

  return newStreamsCount;
}
