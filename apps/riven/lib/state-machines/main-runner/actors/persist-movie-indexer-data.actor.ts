import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { UnrecoverableError } from "bullmq";
import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import z from "zod";

import { database } from "../../../database/database.ts";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface PersistMovieIndexerDataInput extends NonNullable<MediaItemIndexRequestedResponse> {
  sendEvent: MainRunnerMachineIntake;
}

export async function persistMovieIndexerData({
  item,
  sendEvent,
}: PersistMovieIndexerDataInput) {
  if (item.type !== "movie") {
    sendEvent({
      type: "riven.media-item.index.error",
      item,
      error: "Item is not a movie",
    });

    return;
  }

  const itemRequest = await database.itemRequest.findOneOrFail({
    id: item.id,
  });

  if (itemRequest.state !== "requested") {
    sendEvent({
      type: "riven.media-item.index.error.incorrect-state",
      item: itemRequest,
    });

    return;
  }

  const { tmdbId } = itemRequest;

  if (!tmdbId) {
    throw new UnrecoverableError(
      "Item request is missing tmdbId, cannot persist movie indexer data",
    );
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

    await em.refreshOrFail(mediaItem);

    sendEvent({
      type: "riven.media-item.index.success",
      item: mediaItem,
    });

    return mediaItem;
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
      type: "riven.media-item.index.error",
      item: itemRequest,
      error: Array.isArray(parsedError)
        ? parsedError
            .map((err) =>
              err.constraints ? Object.values(err.constraints).join("; ") : "",
            )
            .join("; ")
        : parsedError.message,
    });

    throw error;
  }
}
