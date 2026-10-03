import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";
import assert from "node:assert";

import type {
  ChangeSet,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
  UnitOfWork,
} from "@mikro-orm/core";

type TrackedEntityMap<T extends object> = Map<
  Partial<T>,
  ChangeSet<Partial<T>> | undefined
>;

interface TrackedEntities {
  episodes: TrackedEntityMap<Episode>;
  seasons: TrackedEntityMap<Season>;
  shows: TrackedEntityMap<Show>;
}

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
    const trackedEntities = this.#collectTrackedEntities(uow);

    for (const [episode, changeSet] of trackedEntities.episodes) {
      episode.year = episode.releaseDate
        ? DateTime.fromJSDate(episode.releaseDate).year
        : null;

      this.#computeChangeSet(uow, episode, changeSet);

      if (episode.number === 1) {
        await this.#cascadeReleaseDate(uow, episode, trackedEntities);
      }
    }
  }

  #collectTrackedEntities(uow: UnitOfWork): TrackedEntities {
    const trackedEntities: TrackedEntities = {
      episodes: new Map(),
      seasons: new Map(),
      shows: new Map(),
    };

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedEntities.episodes.set(changeSet.entity, changeSet);
      }

      if (changeSet.entity instanceof Season) {
        trackedEntities.seasons.set(changeSet.entity, changeSet);
      }

      if (changeSet.entity instanceof Show) {
        trackedEntities.shows.set(changeSet.entity, changeSet);
      }
    }

    for (const collectionUpdate of uow.getCollectionUpdates()) {
      if (collectionUpdate.owner instanceof Season) {
        this.#trackCollectionItems(
          trackedEntities.episodes,
          collectionUpdate.filter(
            (episode): episode is Partial<Episode> =>
              episode instanceof Episode,
          ),
        );
      }

      if (collectionUpdate.owner instanceof Show) {
        this.#trackCollectionItems(
          trackedEntities.seasons,
          collectionUpdate.filter(
            (season): season is Partial<Season> => season instanceof Season,
          ),
        );
      }
    }

    return trackedEntities;
  }

  #trackCollectionItems<T extends object>(
    trackedItems: TrackedEntityMap<T>,
    items: T[],
  ) {
    for (const item of items) {
      trackedItems.set(item, trackedItems.get(item));
    }
  }

  /**
   * Cascades the release date of a season's first episode up to the season,
   * and from the first season up to the show.
   */
  async #cascadeReleaseDate(
    uow: UnitOfWork,
    episode: Partial<Episode>,
    trackedEntities: TrackedEntities,
  ) {
    const episodeReleaseDate = episode.releaseDate ?? null;

    assert.ok(
      episode.season,
      "Episode must have a season to cascade release date",
    );

    const season = await episode.season.loadOrFail();

    if (Number(season.releaseDate) === Number(episodeReleaseDate)) {
      return;
    }

    season.releaseDate = episodeReleaseDate;
    season.year = episode.year ?? null;

    this.#computeChangeSet(uow, season, trackedEntities.seasons.get(season));

    if (season.number !== 1) {
      return;
    }

    const show = await season.show.loadOrFail();

    show.releaseDate = season.releaseDate;
    show.year = season.year;

    this.#computeChangeSet(uow, show, trackedEntities.shows.get(show));
  }

  #computeChangeSet(
    uow: UnitOfWork,
    entity: object,
    changeSet: ChangeSet<object> | undefined,
  ) {
    if (changeSet) {
      uow.recomputeSingleChangeSet(entity);
    } else {
      uow.computeChangeSet(entity);
    }
  }
}
