import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import type { EventSubscriber, FlushEventArgs } from "@mikro-orm/core";

export class ShowLikeMediaItemReleaseDateSubscriber implements EventSubscriber {
  async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedEpisodes = new Set<Partial<Episode>>();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedEpisodes.add(changeSet.entity);
      }
    }

    for (const collectionUpdate of uow.getCollectionUpdates()) {
      if (collectionUpdate.owner instanceof Season) {
        const firstEpisode = collectionUpdate.find(
          (episode): episode is Partial<Episode> =>
            episode instanceof Episode &&
            episode.number === 1 &&
            episode.releaseDate != null,
        );

        if (!firstEpisode) {
          continue;
        }

        trackedEpisodes.add(firstEpisode);
      }
    }

    for (const item of trackedEpisodes) {
      if (item.releaseDate == null) {
        continue;
      }

      if (item.number !== 1) {
        continue;
      }

      if (!item.season) {
        continue;
      }

      const season = await item.season.loadOrFail();

      if (season.releaseDate == null) {
        season.releaseDate = item.releaseDate;

        uow.computeChangeSet(season);
      }

      if (season.number === 1) {
        const show = await season.show.loadOrFail();

        if (show.releaseDate == null) {
          show.releaseDate = season.releaseDate;

          uow.computeChangeSet(show);
        }
      }
    }
  }
}
