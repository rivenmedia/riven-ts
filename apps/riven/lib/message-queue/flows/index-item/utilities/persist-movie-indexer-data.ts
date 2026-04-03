import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import assert from "node:assert";

import { database } from "../../../../database/database.ts";

import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface PersistMovieIndexerDataInput {
  item: Extract<
    NonNullable<MediaItemIndexRequestedResponse>["item"],
    { type: "movie" }
  >;
}

export async function persistMovieIndexerData({
  item,
}: PersistMovieIndexerDataInput) {
  const itemRequest = await database.itemRequest.findOneOrFail({
    id: item.id,
  });

  assert(
    itemRequest.state === "requested",
    new MediaItemIndexErrorIncorrectState({
      item: itemRequest,
    }),
  );

  const { tmdbId } = itemRequest;

  if (!tmdbId) {
    throw new MediaItemIndexError({
      item: itemRequest,
      error:
        "Item request is missing tmdbId, cannot persist movie indexer data",
    });
  }

  try {
    return await database.em.fork().transactional(async (transaction) => {
      const mediaItem = transaction.create(Movie, {
        title: item.title,
        imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
        tmdbId,
        contentRating: item.contentRating,
        rating: item.rating ?? null,
        posterPath: item.posterUrl ?? null,
        releaseDate: item.releaseDate ?? null,
        country: item.country ?? null,
        language: item.language ?? null,
        aliases: item.aliases ?? null,
        genres: item.genres,
        itemRequest,
        runtime: item.runtime,
        isRequested: true, // Movies will always be considered to be requested
      });

      transaction.assign(itemRequest, {
        state: mediaItem.isReleased ? "completed" : "unreleased",
      });

      await transaction.flush();

      return await transaction.refreshOrFail(mediaItem);
    });
  } catch (error) {
    throw new MediaItemIndexError({
      item: itemRequest,
      error: String(error),
    });
  }
}
