import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem, Movie } from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import z from "zod";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item/index-requested";

export interface PersistMovieIndexerDataInput extends MediaItemIndexRequestedResponse {
  sendEvent: MainRunnerMachineIntake;
}

export async function persistMovieIndexerData({
  item,
  sendEvent,
}: PersistMovieIndexerDataInput) {
  const existingItem = await database.manager.findOneByOrFail(MediaItem, {
    id: item.id,
  });

  if (existingItem.state !== "Requested") {
    sendEvent({
      type: "riven.media-item.index.already-exists",
      item: {
        ...item,
        id: existingItem.id,
        title: existingItem.title,
      },
    });

    return;
  }

  const itemEntity = new Movie();

  itemEntity.id = item.id;
  itemEntity.title = item.title;

  if (item.posterUrl) {
    itemEntity.posterPath = item.posterUrl;
  }

  if (item.releaseDate) {
    itemEntity.airedAt = DateTime.fromISO(item.releaseDate).toJSDate();
    itemEntity.year = DateTime.fromISO(item.releaseDate).year;
  }

  if (item.country) {
    itemEntity.country = item.country;
  }

  if (item.language) {
    itemEntity.language = item.language;
  }

  if (item.aliases) {
    itemEntity.aliases = item.aliases;
  }

  if (item.contentRating) {
    itemEntity.contentRating = item.contentRating;
  }

  if (item.rating) {
    itemEntity.rating = item.rating;
  }

  itemEntity.isAnime =
    item.language !== "en" &&
    ["animation", "anime"].every((genre) =>
      item.genres.map((g) => g.toLowerCase()).includes(genre),
    );

  itemEntity.genres = item.genres;
  itemEntity.state = "Indexed";

  try {
    await validateOrReject(itemEntity);

    const updatedItem = await database.manager.save(Movie, itemEntity);

    logger.info(
      `Indexed media item: ${item.title} (ID: ${item.id.toString()})`,
    );

    return updatedItem;

    sendEvent({
      type: "riven.media-item.index.success",
      item: updatedItem,
    });
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    sendEvent({
      type: "riven.media-item.index.error",
      item,
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
