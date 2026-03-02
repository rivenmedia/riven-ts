import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import z from "zod";

import { database } from "../../../../database/database.ts";

import type { MediaItemIndexRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export interface PersistShowIndexerDataInput {
  item: Extract<
    NonNullable<MediaItemIndexRequestedResponse>["item"],
    { type: "show" }
  >;
}

export async function persistShowIndexerData({
  item,
}: PersistShowIndexerDataInput) {
  const itemRequest = await database.itemRequest.findOneOrFail({
    id: item.id,
  });

  assert(
    itemRequest.state === "requested",
    new MediaItemIndexErrorIncorrectState({
      item: itemRequest,
    }),
  );

  const { tvdbId } = itemRequest;

  if (!tvdbId) {
    throw new MediaItemIndexError({
      item: itemRequest,
      error: "Item request is missing tvdbId",
    });
  }

  try {
    return await database.em.fork().transactional(async (transaction) => {
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
        itemRequest,
      });

      await transaction.flush();

      let totalEpisodes = 1;

      const sortedSeasons = item.seasons.sort((a, b) => a.number - b.number);

      for (const season of sortedSeasons) {
        const seasonYear = season.episodes[0]?.airedAt
          ? DateTime.fromISO(season.episodes[0].airedAt).year
          : null;

        const seasonEntry = transaction.create(Season, {
          title: `Season ${season.number.toString().padStart(2, "0")}`,
          year: seasonYear,
          number: season.number,
          state: "indexed",
        });

        show.seasons.add(seasonEntry);

        await transaction.flush();

        const sortedEpisodes = season.episodes.sort(
          (a, b) => a.number - b.number,
        );

        for (const episode of sortedEpisodes) {
          const episodeYear = episode.airedAt
            ? DateTime.fromISO(episode.airedAt).year
            : seasonYear;

          const episodeEntry = transaction.create(Episode, {
            absoluteNumber: totalEpisodes++,
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

      transaction.assign(itemRequest, { state: "completed" });

      await transaction.flush();

      return transaction.refreshOrFail(show);
    });
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
