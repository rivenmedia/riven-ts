import { Episode, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

/**
 * Subscriber that updates the `nextAirDate` of a `Show` when an `Episode` transitions from "unreleased" to "indexed".
 */
export class ShowNextAirDateSubscriber implements EventSubscriber<Show> {
  public getSubscribedEntities() {
    return [Show];
  }

  public beforeUpsert({ entity }: EventArgs<Show>) {
    if (
      entity.nextAirDate &&
      DateTime.fromJSDate(entity.nextAirDate) > DateTime.now()
    ) {
      return;
    }

    const upcomingStates = new Set<MediaItemState>(["ongoing", "unreleased"]);

    const nextAiringSeason = entity.seasons.find(({ state }) =>
      upcomingStates.has(state),
    );

    const nextAiringEpisode = nextAiringSeason?.episodes.find(
      ({ state }) => state === "unreleased",
    );

    entity.nextAirDate = nextAiringEpisode?.releaseDate ?? null;
  }

  public async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedEpisodes = new Map<
      Episode,
      ChangeSet<Partial<Episode>> | null
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
          trackedEpisodes.set(episode, trackedEpisodes.get(episode) ?? null);
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

        const episodes = await show.getEpisodes();

        const nextAiringEpisode = episodes.find(
          ({ state, releaseDate }) =>
            state === "unreleased" && releaseDate != null,
        );

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
