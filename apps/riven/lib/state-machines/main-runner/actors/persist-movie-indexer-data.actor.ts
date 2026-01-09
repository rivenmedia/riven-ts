import { database } from "@repo/core-util-database/connection";
import { logger } from "@repo/core-util-logger";
import { MediaItem } from "@repo/util-plugin-sdk/dto/entities/index";

import { ValidationError, validateOrReject } from "class-validator";
import { DateTime } from "luxon";
import { type ActorRef, type Snapshot, fromPromise } from "xstate";
import z from "zod";

import type { ParamsFor } from "@repo/util-plugin-sdk";
import type { MediaItemPersistMovieIndexerDataEvent } from "@repo/util-plugin-sdk/plugin-to-program-events/media-item/persist-movie-indexer-data";
import type { ProgramToPluginEvent } from "@repo/util-plugin-sdk/program-to-plugin-events";

export interface PersistMovieIndexerDataInput extends ParamsFor<MediaItemPersistMovieIndexerDataEvent> {
  parentRef: ActorRef<Snapshot<unknown>, ProgramToPluginEvent>;
}

export const persistMovieIndexerData = fromPromise<
  undefined,
  PersistMovieIndexerDataInput
>(async ({ input: { item, parentRef } }) => {
  const existingItem = await database.manager.findOne(MediaItem, {
    where: {
      state: "Indexed",
      id: item.id,
    },
  });

  if (existingItem) {
    parentRef.send({
      type: "riven.media-item.creation.already-exists",
      item: {
        ...item,
        id: existingItem.id,
        title: existingItem.title,
      },
    });

    return undefined;
  }

  const itemEntity = new MediaItem();

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

    const updatedItem = await database.manager.save(MediaItem, itemEntity);

    logger.info(
      `Indexed media item: ${item.title} (ID: ${item.id.toString()})`,
    );

    parentRef.send({
      type: "riven.media-item.index.success",
      item: updatedItem,
    });
  } catch (error) {
    const parsedError = z
      .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
      .parse(error);

    parentRef.send({
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
  }
});
