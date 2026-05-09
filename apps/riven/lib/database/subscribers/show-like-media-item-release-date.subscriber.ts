import { Episode, Season } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

export class ShowLikeMediaItemReleaseDateSubscriber implements EventSubscriber {
  async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedEpisodes = new Map<
      Partial<Episode>,
      ChangeSet<Partial<Episode>> | null
    >();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof Episode) {
        trackedEpisodes.set(changeSet.entity, changeSet);
      }
    }

    for (const collectionUpdate of uow.getCollectionUpdates()) {
      if (collectionUpdate.owner instanceof Season) {
        const collectionEpisodes = collectionUpdate.filter(
          (episode): episode is Partial<Episode> =>
            episode instanceof Episode && episode.releaseDate != null,
        );

        for (const episode of collectionEpisodes) {
          trackedEpisodes.set(episode, trackedEpisodes.get(episode) ?? null);
        }
      }
    }

    for (const [episode, changeSet] of trackedEpisodes) {
      if (episode.releaseDate == null) {
        continue;
      }

      episode.year ??= DateTime.fromJSDate(episode.releaseDate).year;

      if (changeSet) {
        uow.recomputeSingleChangeSet(episode);
      } else {
        uow.computeChangeSet(episode);
      }

      if (episode.number !== 1) {
        continue;
      }

      if (!episode.season) {
        continue;
      }

      const season = await episode.season.loadOrFail();

      if (season.releaseDate == null) {
        season.releaseDate = episode.releaseDate;
        season.year = episode.year;

        uow.computeChangeSet(season);
      }

      if (season.number === 1) {
        const show = await season.show.loadOrFail();

        if (show.releaseDate == null) {
          show.releaseDate = season.releaseDate;
          show.year = DateTime.fromJSDate(season.releaseDate).year;

          const itemRequest = await show.itemRequest.loadOrFail();

          itemRequest.state = !show.isReleased
            ? "unreleased"
            : show.status === "continuing"
              ? "ongoing"
              : "completed";

          uow.computeChangeSet(itemRequest);
          uow.computeChangeSet(show);
        }
      }
    }
  }
}
