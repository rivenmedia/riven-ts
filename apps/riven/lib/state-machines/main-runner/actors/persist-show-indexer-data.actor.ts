import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";

import { UnrecoverableError } from "bullmq";
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

  const { tvdbId } = itemRequest;

  if (!tvdbId) {
    throw new UnrecoverableError("Item request is missing tvdbId");
  }

  try {
    const em = database.em.fork();

    const show = await em.transactional(async (transaction) => {
      const firstAired = item.firstAired
        ? DateTime.fromISO(item.firstAired)
        : null;

      const show = transaction.create(Show, {
        title: item.title,
        contentRating: item.contentRating,
        state: "indexed",
        imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
        tvdbId,
        status: item.status,
        posterPath: item.posterUrl ?? null,
        airedAt: firstAired?.toJSDate() ?? null,
        year: firstAired?.year ?? null,
        country: item.country ?? null,
        language: item.language ?? null,
        aliases: item.aliases ?? null,
        rating: item.rating ?? null,
        genres: item.genres.map((genre) => genre.toLowerCase()),
      });

      await transaction.flush();

      let totalEpisodes = 0;

      for (const season of item.seasons) {
        const seasonYear = season.episodes[0]?.airedAt
          ? DateTime.fromISO(season.episodes[0].airedAt).year
          : null;

        const seasonEntry = transaction.create(Season, {
          title: `${show.title} - Season ${season.number.toString().padStart(2, "0")}`,
          imdbId: show.imdbId ?? null,
          year: seasonYear,
          number: season.number,
          state: "indexed",
        });

        show.seasons.add(seasonEntry);

        await transaction.flush();

        for (const episode of season.episodes) {
          const episodeYear = episode.airedAt
            ? DateTime.fromISO(episode.airedAt).year
            : seasonYear;

          const episodeEntry = transaction.create(Episode, {
            imdbId: seasonEntry.imdbId ?? null,
            absoluteNumber: ++totalEpisodes,
            contentRating: episode.contentRating,
            number: episode.number,
            title: episode.title,
            state: "indexed",
            year: episodeYear,
          });

          seasonEntry.episodes.add(episodeEntry);
        }
      }

      await validateOrReject(show);

      await transaction.flush();

      return show;
    });

    await em.refreshOrFail(show);

    sendEvent({
      type: "riven.media-item.index.success",
      item: show,
    });

    return show;
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
