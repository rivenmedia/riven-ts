import { Episode, MediaItem, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

export class MediaItemStateSubscriber implements EventSubscriber {
  onFlush({ uow }: FlushEventArgs): void {
    const trackedItems = new Map<
      MediaItem,
      ChangeSet<Partial<MediaItem>> | null
    >();

    for (const changeSet of uow.getChangeSets()) {
      if (changeSet.entity instanceof MediaItem) {
        trackedItems.set(changeSet.entity, changeSet);
      }
    }

    for (const collection of uow.getCollectionUpdates()) {
      if (collection.owner instanceof MediaItem) {
        trackedItems.set(collection.owner, null);
      }
    }

    for (const [item, changeSet] of trackedItems) {
      const nextState = this.#computeState(item);

      if (nextState === item.state) {
        continue;
      }

      item.state = nextState;

      if (changeSet) {
        uow.recomputeSingleChangeSet(item);
      } else {
        uow.computeChangeSet(item);
      }
    }
  }

  #computeState(item: MediaItem): MediaItemState {
    if (item.state === "paused" || item.state === "failed") {
      return item.state;
    }

    if (item instanceof Episode || item instanceof Movie) {
      const hasMediaEntry = item.filesystemEntries
        .getItems(false)
        .some((entry) => entry.type === "media");

      if (hasMediaEntry) {
        return "downloaded";
      }
    }

    const blacklistedStreams = new Set(item.blacklistedStreams.getItems(false));
    const hasAvailableStreams = item.streams
      .getItems(false)
      .some((stream) => !blacklistedStreams.has(stream));

    if (hasAvailableStreams) {
      return "scraped";
    }

    if (item.airedAt && DateTime.fromJSDate(item.airedAt) > DateTime.now()) {
      return "unreleased";
    }

    return "indexed";
  }
}
