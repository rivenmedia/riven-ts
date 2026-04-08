import {
  Episode,
  Season,
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

    for (const [item, changeSet] of trackedItems) {
      if (!changeSet?.payload.releaseDate) {
        continue;
      }

      if (item instanceof Episode) {
        const parent = await item.season.loadOrFail();

        if (item.number === 1 && parent.releaseDate == null) {
          parent.releaseDate = item.releaseDate;

          uow.computeChangeSet(parent);

          const show = await parent.getShow();

          if (show.releaseDate == null) {
            show.releaseDate = parent.releaseDate;

            uow.computeChangeSet(show);
          }
        }

        continue;
      }

      if (item instanceof Season) {
        const parent = await item.getShow();

        if (item.number === 1 && parent.releaseDate == null) {
          parent.releaseDate = item.releaseDate;

          uow.computeChangeSet(parent);
        }

        continue;
      }
    }
  }
}
