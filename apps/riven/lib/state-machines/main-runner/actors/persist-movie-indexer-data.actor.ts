import { Movie } from "@repo/util-plugin-sdk/dto/entities";

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

  const existingItem = await database.requestedItem.findOneOrFail({
    id: item.id,
  });

  if (existingItem.state !== "Requested") {
    sendEvent({
      type: "riven.media-item.index.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  const em = database.em.fork();

  existingItem.id = item.id;
  existingItem.title = item.title;

  if (item.posterUrl) {
    existingItem.posterPath = item.posterUrl;
  }

  if (item.releaseDate) {
    existingItem.airedAt = DateTime.fromISO(item.releaseDate).toJSDate();
    existingItem.year = DateTime.fromISO(item.releaseDate).year;
  }

  if (item.country) {
    existingItem.country = item.country;
  }

  if (item.language) {
    existingItem.language = item.language;
  }

  if (item.aliases) {
    existingItem.aliases = item.aliases;
  }

  if (item.contentRating) {
    existingItem.contentRating = item.contentRating;
  }

  if (item.rating) {
    existingItem.rating = item.rating;
  }

  existingItem.isAnime =
    item.language !== "en" &&
    ["animation", "anime"].every((genre) =>
      item.genres.map((g) => g.toLowerCase()).includes(genre),
    );

  existingItem.genres = item.genres;
  existingItem.state = "Indexed";
  existingItem.type = "movie";

  em.persist(existingItem);

  try {
    await validateOrReject(existingItem);

    await em.flush();

    const item = await em.findOneOrFail(Movie, existingItem);

    sendEvent({
      type: "riven.media-item.index.success",
      item: item,
    });

    return item;
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
      type: "riven.media-item.index.error",
      item: existingItem,
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
