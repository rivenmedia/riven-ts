import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";
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

  const processableStates = ItemRequestState.extract(["requested", "ongoing"]);

  assert(
    processableStates.safeParse(itemRequest.state).success,
    new MediaItemIndexErrorIncorrectState({
      item: itemRequest,
    }),
  );

  try {
    return await database.em.fork().transactional(async (transaction) => {
      const existingShow = await transaction.getRepository(Show).findOne(
        {
          itemRequest: { id: itemRequest.id },
          status: {
            $in: ["continuing", "upcoming"],
          },
        },
        { populate: ["$infer"] },
      );

      const { tvdbId } = itemRequest;

      if (!tvdbId) {
        throw new MediaItemIndexError({
          item: itemRequest,
          error: "Item request is missing tvdbId",
        });
      }

      const firstAired = item.firstAired
        ? DateTime.fromISO(item.firstAired)
        : null;

      const show =
        existingShow ??
        transaction.create(
          Show,
          {
            tvdbId,
            imdbId: item.imdbId ?? itemRequest.imdbId ?? null,
            itemRequest,
            isRequested: true, // Shows will always be considered to be requested
            state: "indexed",
          },
          { partial: true },
        );

      show.title = item.title;
      show.fullTitle = show.title;
      show.contentRating = item.contentRating;
      show.posterPath = item.posterUrl ?? show.posterPath ?? null;
      show.releaseDate = firstAired?.toJSDate() ?? show.releaseDate ?? null;
      show.nextAirDate = item.nextAired
        ? DateTime.fromISO(item.nextAired).toJSDate()
        : null;
      show.year = firstAired?.year ?? show.year ?? null;
      show.country = item.country ?? show.country ?? null;
      show.language = item.language ?? show.language ?? null;
      show.aliases = {
        ...show.aliases,
        ...item.aliases,
      };
      show.rating = item.rating ?? show.rating ?? null;
      show.status = item.status;
      show.keepUpdated = item.keepUpdated;
      show.genres = [...(show.genres ?? []), ...item.genres].map((genre) =>
        genre.toLowerCase(),
      );

      await transaction.upsert(show);

      for (const season of Object.values(item.seasons)) {
        const [existingSeason] = await show.seasons.matching({
          limit: 1,
          where: {
            number: season.number,
          },
          populate: ["episodes"],
        });

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

        const seasonEntry =
          existingSeason ??
          transaction.create(
            Season,
            {
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
              state: "indexed",
            },
            { partial: true },
          );

        if (seasonFirstAired) {
          seasonEntry.releaseDate =
            DateTime.fromISO(seasonFirstAired).toJSDate();
        }

        seasonEntry.title = seasonTitle;
        seasonEntry.number = season.number;
        seasonEntry.fullTitle = `${show.title} - S${seasonEntry.number.toString().padStart(2, "0")}`;
        seasonEntry.isSpecial = season.number === 0;
        seasonEntry.year = seasonYear;

        show.seasons.add(seasonEntry);

        await transaction.upsert(seasonEntry);

        for (const episode of season.episodes) {
          const [existingEpisode] = existingSeason
            ? await existingSeason.episodes.matching({
                limit: 1,
                where: {
                  number: episode.number,
                },
              })
            : [null];

          const episodeYear = episode.airedAt
            ? DateTime.fromISO(episode.airedAt).year
            : seasonYear;

          const isUnreleased = episode.airedAt
            ? DateTime.fromISO(episode.airedAt) > DateTime.now()
            : true; // If there's no air date, assume the episode is unreleased

          const episodeEntry =
            existingEpisode ??
            transaction.create(
              Episode,
              {
                tvdbId: seasonEntry.tvdbId,
                imdbId: seasonEntry.imdbId ?? null,
                isSpecial: season.number === 0,
                isRequested: seasonEntry.isRequested,
                itemRequest,
              },
              { partial: true },
            );

          if (episode.airedAt) {
            episodeEntry.releaseDate = DateTime.fromISO(
              episode.airedAt,
            ).toJSDate();

            if (show.status === "continuing" || show.status === "upcoming") {
              show.nextAirDate = episodeEntry.releaseDate;
            }
          }

          episodeEntry.title = episode.title;
          episodeEntry.number = episode.number;
          episodeEntry.fullTitle = `${seasonEntry.fullTitle}E${episodeEntry.number.toString().padStart(2, "0")} - ${episodeEntry.title}`;
          episodeEntry.absoluteNumber = episode.absoluteNumber;
          episodeEntry.contentRating = episode.contentRating;
          episodeEntry.runtime = episode.runtime;
          episodeEntry.year = episodeYear;
          episodeEntry.state =
            isUnreleased && season.number > 0 ? "unreleased" : "indexed";

          seasonEntry.episodes.add(episodeEntry);

          await transaction.upsert(episodeEntry);
        }
      }

      await validateOrReject(show);

      transaction.assign(itemRequest, {
        state: item.keepUpdated ? "ongoing" : "completed",
      });

      await transaction.upsert(show);

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
