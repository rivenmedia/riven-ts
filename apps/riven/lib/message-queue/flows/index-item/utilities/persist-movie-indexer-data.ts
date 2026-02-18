import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import assert from "node:assert";
import z from "zod";

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
    const em = database.em.fork();

    const mediaItem = em.create(Movie, {
      title: item.title,
      imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
      tmdbId,
      contentRating: item.contentRating,
      rating: item.rating ?? null,
      posterPath: item.posterUrl ?? null,
      airedAt: item.releaseDate
        ? DateTime.fromISO(item.releaseDate).toJSDate()
        : null,
      year: item.releaseDate ? DateTime.fromISO(item.releaseDate).year : null,
      country: item.country ?? null,
      language: item.language ?? null,
      aliases: item.aliases ?? null,
      genres: item.genres,
      state: "indexed",
    });

    await validateOrReject(mediaItem);

    await em.flush();

    return await em.refreshOrFail(mediaItem);
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

    throw new MediaItemIndexError({
      item: itemRequest,
      error: errorMessage,
    });
  }
}
