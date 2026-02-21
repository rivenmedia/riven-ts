import { MediaItem, Season, Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import {
  type ChangeSet,
  ChangeSetType,
  type EventSubscriber,
  type FlushEventArgs,
} from "@mikro-orm/core";

export class MediaItemStatePropagationSubscriber implements EventSubscriber {
  async onFlush({ em, uow }: FlushEventArgs) {
    const changeSets = uow.getChangeSets();

    for (const rawChangeSet of changeSets) {
      if (!(rawChangeSet.entity instanceof MediaItem)) {
        continue;
      }

      if (rawChangeSet.type !== ChangeSetType.UPDATE) {
        continue;
      }

      const changeSet = rawChangeSet as ChangeSet<Partial<MediaItem>>;
      const { state: nextState } = changeSet.payload;

      if (nextState == null) {
        continue;
      }

      const propagableStates = MediaItemState.extract([
        "downloaded",
        "indexed",
        "scraped",
      ]);

      if (!propagableStates.safeParse(nextState).success) {
        continue;
      }

      if (changeSet.entity instanceof Show) {
        await em.populate(changeSet.entity, ["seasons.episodes"]);

        changeSet.entity.seasons.getItems().forEach((season) => {
          if (season.state === nextState) {
            return;
          }

          season.episodes.getItems().forEach((episode) => {
            if (episode.state === nextState) {
              return;
            }

            episode.state = nextState;
            uow.computeChangeSet(episode);
          });

          season.state = nextState;
          uow.computeChangeSet(season);
        });
      }

      if (changeSet.entity instanceof Season) {
        await em.populate(changeSet.entity, ["episodes"]);

        changeSet.entity.episodes.getItems().forEach((episode) => {
          if (episode.state === nextState) {
            return;
          }

          episode.state = nextState;
          uow.computeChangeSet(episode);
        });
      }
    }
  }
}
