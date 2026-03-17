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
        imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
        tvdbId,
        status: item.status,
        posterPath: item.posterUrl ?? null,
        airedAt: firstAired?.toISODate() ?? null,
        year: firstAired?.year ?? null,
        country: item.country ?? null,
        language: item.language ?? null,
        aliases: item.aliases ?? null,
        rating: item.rating ?? null,
        genres: item.genres.map((genre) => genre.toLowerCase()),
        itemRequest,
        isRequested: true, // Shows will always be considered to be requested
      });

      await transaction.flush();

      for (const season of Object.values(item.seasons)) {
        const seasonFirstAired = season.episodes[0]?.airedAt ?? null;

        const seasonYear = seasonFirstAired
          ? DateTime.fromISO(seasonFirstAired).year
          : null;

        const seasonTitle = [
          `Season ${season.number.toString().padStart(2, "0")}`,
          season.title,
        ]
          .filter(Boolean)
          .join(" - ");

        const seasonEntry = transaction.create(Season, {
          title: seasonTitle,
          year: seasonYear,
          number: season.number,
          airedAt: seasonFirstAired,
          isSpecial: season.number === 0,
          /**
           * If the item request has specific seasons requested, only mark this season as requested if it's included in that list.
           *
           * Otherwise, request all non-special seasons. This is the default behaviour of list ingestion.
           */
          isRequested: itemRequest.seasons
            ? itemRequest.seasons.includes(season.number)
            : season.number > 0,
        });

        show.seasons.add(seasonEntry);

        await transaction.flush();

        for (const episode of season.episodes) {
          const episodeYear = episode.airedAt
            ? DateTime.fromISO(episode.airedAt).year
            : seasonYear;

          const episodeEntry = transaction.create(Episode, {
            absoluteNumber: episode.absoluteNumber,
            contentRating: episode.contentRating,
            number: episode.number,
            title: episode.title,
            year: episodeYear,
            airedAt: episode.airedAt ?? null,
            isSpecial: season.number === 0,
            isRequested: seasonEntry.isRequested,
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
