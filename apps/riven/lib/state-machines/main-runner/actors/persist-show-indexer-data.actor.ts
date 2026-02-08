import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities/index";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import { ref } from "@mikro-orm/core";
import { ValidationError, validateOrReject } from "class-validator";
import z from "zod";

import { database } from "../../../database/database.ts";

import type { MainRunnerMachineIntake } from "../index.ts";
import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface PersistShowIndexerDataInput extends NonNullable<MediaItemIndexRequestedResponse> {
  sendEvent: MainRunnerMachineIntake;
}

export async function persistShowIndexerData({
  item,
  sendEvent,
}: PersistShowIndexerDataInput) {
  if (item.type !== "show") {
    sendEvent({
      type: "riven.media-item.index.error",
      item,
      error: "Item is not a show",
    });

    return;
  }

  const existingItem = await database.show.findOneOrFail({
    id: item.id,
  });

  if (existingItem.state !== "Requested") {
    sendEvent({
      type: "riven.media-item.index.error.incorrect-state",
      item: existingItem,
    });

    return;
  }

  try {
    const em = database.em.fork();

    await em.transactional(async (transaction) => {
      existingItem.id = item.id;
      existingItem.title = item.title;

      if (item.posterUrl) {
        existingItem.posterPath = item.posterUrl;
      }

      existingItem.airedAt = DateTime.fromISO(item.firstAired).toJSDate();
      existingItem.year = DateTime.fromISO(item.firstAired).year;

      if (item.country) {
        existingItem.country = item.country;
      }

      if (item.language) {
        existingItem.language = item.language;
      }

      if (item.aliases) {
        existingItem.aliases = item.aliases;
      }

      existingItem.contentRating = item.contentRating;

      if (item.rating) {
        existingItem.rating = item.rating;
      }

      for (const season of item.seasons) {
        const seasonEntry = transaction.create(Season, {
          title: `${existingItem.title} - Season ${season.number.toString()}`,
          number: season.number,
          parent: ref(existingItem),
          state: "Indexed",
        });

        await transaction.flush();

        for (const episode of season.episodes) {
          transaction.create(Episode, {
            contentRating: episode.contentRating,
            number: episode.number,
            title: episode.title,
            state: "Indexed",
            season: ref(seasonEntry),
          });
        }
      }

      existingItem.genres = item.genres.map((genre) => genre.toLowerCase());
      existingItem.state = "Indexed";
      existingItem.type = "show";
      existingItem.status = item.status;

      await validateOrReject(existingItem);

      await transaction.flush();
    });

    const updatedItem = await em.refreshOrFail(existingItem);

    sendEvent({
      type: "riven.media-item.index.success",
      item: updatedItem,
    });

    return updatedItem;
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
