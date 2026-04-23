import {
  Episode,
  ItemRequest,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";
import { DateTime } from "@repo/util-plugin-sdk/helpers/dates";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { ValidationError, validateOrReject } from "class-validator";
import assert from "node:assert";
import z from "zod";

import type { EntityManager } from "@mikro-orm/core";
import type { MediaItemIndexRequestedShowResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

export type ShowIndexData =
  NonNullable<MediaItemIndexRequestedShowResponse>["item"];

export async function persistShowIndexerData(
  em: EntityManager,
  item: ShowIndexData,
) {
  const itemRequest = await em.findOneOrFail(ItemRequest, {
    id: item.id,
  });

  const processableStates = ItemRequestState.extract([
    "requested",
    "ongoing",
    "unreleased",
  ]);

  assert(
    processableStates.safeParse(itemRequest.state).success,
    new MediaItemIndexErrorIncorrectState({
      item: itemRequest,
    }),
  );

  const existingShow = await em.getRepository(Show).findOne(
    {
      itemRequest: { id: itemRequest.id },
    },
    { populate: ["$infer"] },
  );

  if (existingShow?.status === "ended") {
    throw new MediaItemIndexError({
      item: itemRequest,
      error: `${existingShow.fullTitle} has already ended and will not be re-indexed.`,
    });
  }

  const { tvdbId } = itemRequest;

  if (!tvdbId) {
    throw new MediaItemIndexError({
      item: itemRequest,
      error: "Item request is missing tvdbId",
    });
  }

  try {
    const show = em.create(Show, {
      title: item.title,
      fullTitle: item.title,
      contentRating: item.contentRating,
      posterPath: item.posterUrl ?? existingShow?.posterPath ?? null,
      country: item.country ?? existingShow?.country ?? null,
      language: item.language ?? existingShow?.language ?? null,
      rating: item.rating ?? existingShow?.rating ?? null,
      status: item.status,
      tvdbId,
      imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
      itemRequest,
      isRequested: true, // Shows will always be considered to be requested
      network: item.network,
      aliases: item.aliases,
      genres: item.genres.map((genre) => genre.toLowerCase()),
      nextAirDate: null, // Reset the next air date; it will be recalculated during episode processing
    });

    await em.upsert(show);

    for (const season of Object.values(item.seasons)) {
      const seasonTitle = [
        `Season ${season.number.toString().padStart(2, "0")}`,
        season.title,
      ]
        .filter(Boolean)
        .join(" - ");

      const seasonEntry = em.create(Season, {
        title: seasonTitle,
        fullTitle: `${show.title} - S${season.number.toString().padStart(2, "0")}`,
        number: season.number,
        tvdbId: show.tvdbId,
        imdbId: show.imdbId ?? null,
        /**
         * If the item request has specific seasons requested, only mark this season as requested if it's included in that list.
         *
         * Otherwise, request all non-special seasons. This is the default behaviour of list ingestion.
         */
        isRequested: itemRequest.seasons
          ? itemRequest.seasons.includes(season.number)
          : season.number > 0,
        itemRequest,
      });

      show.seasons.add(seasonEntry);

      await em.upsert(seasonEntry);

      for (const episode of season.episodes) {
        const episodeEntry = em.create(Episode, {
          title: episode.title,
          fullTitle: `${seasonEntry.fullTitle}E${episode.number.toString().padStart(2, "0")} - ${episode.title}`,
          number: episode.number,
          absoluteNumber: episode.absoluteNumber,
          contentRating: episode.contentRating,
          runtime: episode.runtime,
          releaseDate: episode.airedAt
            ? DateTime.fromISO(episode.airedAt).toJSDate()
            : null,
          tvdbId: seasonEntry.tvdbId,
          imdbId: seasonEntry.imdbId ?? null,
          isRequested: seasonEntry.isRequested,
          itemRequest,
        });

        if (
          !seasonEntry.isSpecial &&
          !episodeEntry.isReleased &&
          episodeEntry.releaseDate &&
          !show.nextAirDate
        ) {
          show.nextAirDate = episodeEntry.releaseDate;

          await em.upsert(show);
        }

        seasonEntry.episodes.add(episodeEntry);

        await em.upsert(episodeEntry);
      }
    }

    await validateOrReject(show);

    em.assign(itemRequest, {
      state: !show.isReleased
        ? "unreleased"
        : item.status === "continuing"
          ? "ongoing"
          : "completed",
    });

    return show;
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
