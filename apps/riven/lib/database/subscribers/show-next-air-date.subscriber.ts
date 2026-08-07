import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

/**
 * Subscriber that updates the `nextAirDate` of a `Show` when an `Episode` transitions from "unreleased" to "indexed".
 */
export class ShowNextAirDateSubscriber implements EventSubscriber<Show> {
  public getSubscribedEntities() {
    return [Show];
  }

  public async beforeUpsert({ entity }: EventArgs<Show>) {
    if (
      entity.nextAirDate &&
      DateTime.fromJSDate(entity.nextAirDate) > DateTime.now()
    ) {
      return;
    }

    if (entity.episodes.length === 0) {
      return;
    }

    const nextAiringEpisode = await entity.getNextAiringEpisode();

    entity.nextAirDate = nextAiringEpisode?.releaseDate ?? null;
  }

  public async afterFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedEpisodes = new Map<
      Episode,
      ChangeSet<Partial<Episode>> | undefined
    >();

    const processedShows = new Set<Show>();

    let hasShowChangeSet = false;

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedEpisodes.set(changeSet.entity, changeSet);
      }

      if (changeSet.entity instanceof Show) {
        hasShowChangeSet = true;
      }
    }

    for (const collectionUpdate of uow.getCollectionUpdates()) {
      if (collectionUpdate.owner instanceof Season) {
        const collectionEpisodes = collectionUpdate.filter(
          (episode): episode is Episode =>
            episode instanceof Episode && episode.releaseDate != null,
        );

        for (const episode of collectionEpisodes) {
          trackedEpisodes.set(episode, trackedEpisodes.get(episode));
        }
      }
    }

    for (const [episode, changeSet] of trackedEpisodes) {
      if (
        changeSet?.payload.state === "unreleased" ||
        (changeSet?.originalEntity?.state === "unreleased" &&
          changeSet.payload.state === "indexed")
      ) {
        const show = await episode.getShow();

        if (processedShows.has(show)) {
          continue;
        }

        processedShows.add(show);

        const nextAiringEpisode = await show.getNextAiringEpisode();

        show.nextAirDate = nextAiringEpisode?.releaseDate ?? null;

        if (hasShowChangeSet) {
          uow.recomputeSingleChangeSet(show);
        } else {
          uow.computeChangeSet(show);
        }
      }
    }
  }
}
