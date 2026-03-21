import {
  Episode,
  Season,
  Show,
  ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

export class ShowLikeMediaItemReleaseDateSubscriber implements EventSubscriber {
  async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedItems = new Map<
      ShowLikeMediaItem,
      ChangeSet<Partial<ShowLikeMediaItem>> | null
    >();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof ShowLikeMediaItem) {
        trackedItems.set(changeSet.entity, changeSet);
      }
    }

    for (const collection of uow.getCollectionUpdates()) {
      if (
        collection.owner instanceof ShowLikeMediaItem &&
        !trackedItems.has(collection.owner)
      ) {
        trackedItems.set(collection.owner, null);
      }
    }

    const seasonsAwaitingUpdate = new Set<Season>();
    const showsAwaitingUpdate = new Set<Show>();

    // Process direct updates from the unit of work
    for (const [item, changeSet] of trackedItems) {
      if (changeSet?.payload.releaseDate === undefined) {
        continue;
      }

      if (item instanceof Show) {
        continue;
      }

      if (item instanceof Episode) {
        const parent = await item.season.loadOrFail();

        if (parent.releaseDate == null) {
          seasonsAwaitingUpdate.add(parent);
        }

        continue;
      }

      if (item instanceof Season) {
        const parent = await item.getShow();

        if (parent.releaseDate == null) {
          showsAwaitingUpdate.add(parent);
        }

        continue;
      }
    }

    for (const season of seasonsAwaitingUpdate) {
      if (season.releaseDate != null) {
        continue;
      }

      const [firstEpisode] = await season.episodes.matching({
        where: { number: 1 },
      });

      if (firstEpisode?.releaseDate) {
        season.releaseDate = firstEpisode.releaseDate;

        showsAwaitingUpdate.add(await season.getShow());
      }

      uow.computeChangeSet(season);
    }

    for (const show of showsAwaitingUpdate) {
      if (show.releaseDate != null) {
        continue;
      }

      const [firstSeason] = await show.seasons.matching({
        where: { number: 1 },
      });

      if (firstSeason?.releaseDate) {
        show.releaseDate = firstSeason.releaseDate;
      }

      uow.computeChangeSet(show);
    }
  }
}
