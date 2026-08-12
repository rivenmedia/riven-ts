import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import assert from "node:assert";

import type {
  ChangeSet,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

export class ShowLikeMediaItemReleaseDateSubscriber implements EventSubscriber<Show> {
  public getSubscribedEntities() {
    return [Show];
  }

  public beforeUpsert({ entity }: EventArgs<Show>) {
    const firstSeason = entity.seasons.find((season) => season.number === 1);

    if (!firstSeason) {
      return;
    }

    const firstEpisode = firstSeason.episodes.find(
      (episode) => episode.number === 1,
    );

    if (!firstEpisode) {
      return;
    }

    firstEpisode.year = firstEpisode.releaseDate
      ? DateTime.fromJSDate(firstEpisode.releaseDate).year
      : null;

    entity.releaseDate = firstEpisode.releaseDate ?? null;
    entity.year = firstEpisode.year ?? null;

    firstSeason.releaseDate = firstEpisode.releaseDate ?? null;
    firstSeason.year = firstEpisode.year ?? null;
  }

  public async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedEpisodes = new Map<
      Partial<Episode>,
      ChangeSet<Partial<Episode>> | undefined
    >();

    const trackedSeasons = new Map<
      Partial<Season>,
      ChangeSet<Partial<Season>> | undefined
    >();

    const trackedShows = new Map<
      Partial<Show>,
      ChangeSet<Partial<Show>> | undefined
    >();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedEpisodes.set(changeSet.entity, changeSet);
      }

      if (changeSet.entity instanceof Season) {
        trackedSeasons.set(changeSet.entity, changeSet);
      }

      if (changeSet.entity instanceof Show) {
        trackedShows.set(changeSet.entity, changeSet);
      }
    }

    for (const collectionUpdate of uow.getCollectionUpdates()) {
      if (collectionUpdate.owner instanceof Season) {
        const collectionEpisodes = collectionUpdate.filter(
          (episode): episode is Partial<Episode> => episode instanceof Episode,
        );

        for (const episode of collectionEpisodes) {
          trackedEpisodes.set(episode, trackedEpisodes.get(episode));
        }
      }

      if (collectionUpdate.owner instanceof Show) {
        const collectionSeasons = collectionUpdate.filter(
          (season): season is Partial<Season> => season instanceof Season,
        );

        for (const season of collectionSeasons) {
          trackedSeasons.set(season, trackedSeasons.get(season));
        }
      }
    }

    for (const [episode, changeSet] of trackedEpisodes) {
      episode.year = episode.releaseDate
        ? DateTime.fromJSDate(episode.releaseDate).year
        : null;

      if (changeSet) {
        uow.recomputeSingleChangeSet(episode);
      } else {
        uow.computeChangeSet(episode);
      }

      if (episode.number !== 1) {
        continue;
      }

      const episodeReleaseDate = episode.releaseDate ?? null;

      assert.ok(
        episode.season,
        "Episode must have a season to cascade release date",
      );

      const season = await episode.season.loadOrFail();

      if (Number(season.releaseDate) === Number(episodeReleaseDate)) {
        continue;
      }

      const seasonChangeSet = trackedSeasons.get(season);

      season.releaseDate = episodeReleaseDate;
      season.year = episode.year;

      if (seasonChangeSet) {
        uow.recomputeSingleChangeSet(season);
      } else {
        uow.computeChangeSet(season);
      }

      if (season.number === 1) {
        const show = await season.show.loadOrFail();
        const showChangeSet = trackedShows.get(show);

        show.releaseDate = season.releaseDate;
        show.year = season.year;

        if (showChangeSet) {
          uow.recomputeSingleChangeSet(show);
        } else {
          uow.computeChangeSet(show);
        }
      }
    }
  }
}
