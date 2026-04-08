import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

export class ShowLikeMediaItemReleaseDateSubscriber implements EventSubscriber {
  async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedItems = new Map<Episode, ChangeSet<Partial<Episode>> | null>();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedItems.set(changeSet.entity, changeSet);
      }
    }

    for (const [item, changeSet] of trackedItems) {
      if (!changeSet?.entity.season || item.number !== 1) {
        continue;
      }

      const parent = await changeSet.entity.season.loadOrFail();

      if (parent.releaseDate == null) {
        parent.releaseDate = item.releaseDate;

        uow.computeChangeSet(parent);
      }

      if (parent.number === 1) {
        const show = await parent.show.loadOrFail();

        if (show.releaseDate == null) {
          show.releaseDate = parent.releaseDate;

          uow.computeChangeSet(show);
        }
      }
    }
  }
}
