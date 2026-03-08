import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
  type ShowLikeMediaItem,
} from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
  UnitOfWork,
} from "@mikro-orm/core";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { Promisable } from "type-fest";

type NextStatesMap = Map<MediaItem, MediaItemState>;

export class MediaItemStateSubscriber implements EventSubscriber {
  async onFlush({ uow }: FlushEventArgs): Promise<void> {
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
      if (
        collection.owner instanceof MediaItem &&
        !trackedItems.has(collection.owner)
      ) {
        trackedItems.set(collection.owner, null);
      }
    }

    const seasonsAwaitingUpdate = new Set<Season>();
    const showsAwaitingUpdate = new Set<Show>();
    const nextStatesMap: NextStatesMap = new Map();

    // Process direct updates from the unit of work
    for (const [item, changeSet] of trackedItems) {
      const stateChanged = await this.#maybeUpdateState(
        item,
        changeSet,
        uow,
        nextStatesMap,
      );

      if (!stateChanged) {
        continue;
      }

      if (item instanceof Season) {
        showsAwaitingUpdate.add(await item.getShow());
      }

      if (item instanceof Episode) {
        seasonsAwaitingUpdate.add(await item.season.loadOrFail());
      }
    }

    // Handle season state propagation
    for (const season of seasonsAwaitingUpdate) {
      const stateChanged = await this.#maybeUpdateState(
        season,
        trackedItems.get(season) ?? null,
        uow,
        nextStatesMap,
      );

      if (stateChanged) {
        showsAwaitingUpdate.add(await season.getShow());
      }
    }

    // Handle show state propagation
    for (const show of showsAwaitingUpdate) {
      await this.#maybeUpdateState(
        show,
        trackedItems.get(show) ?? null,
        uow,
        nextStatesMap,
      );
    }
  }

  async #computeNextState(
    entity: MediaItem,
    nextStatesMap: NextStatesMap,
  ): Promise<MediaItemState> {
    if (entity instanceof Season) {
      return this.#computeStateWithChildren(
        entity,
        await entity.episodes.loadItems(),
        nextStatesMap,
      );
    }

    if (entity instanceof Show) {
      return this.#computeStateWithChildren(
        entity,
        await entity.seasons.loadItems(),
        nextStatesMap,
      );
    }

    return this.#computeState(entity);
  }

  #buildChildrenStateCountMap(
    children: MediaItem[],
    nextStatesMap: NextStatesMap,
  ) {
    return children.reduce<Partial<Record<MediaItemState, number>>>(
      (acc, child) => {
        const childState = nextStatesMap.get(child) ?? child.state;

        return {
          ...acc,
          [childState]: (acc[childState] ?? 0) + 1,
        };
      },
      {},
    );
  }

  #determineFixedState(item: MediaItem) {
    if (item.state === "paused" || item.state === "failed") {
      return item.state;
    }

    return null;
  }

  #determineParentStateFromChildren(
    parent: ShowLikeMediaItem,
    children: MediaItem[],
    nextStatesMap: NextStatesMap,
  ): MediaItemState | null {
    if (children.length === 0) {
      return null;
    }

    const childrenStateCountMap = this.#buildChildrenStateCountMap(
      children,
      nextStatesMap,
    );

    const propagableStates = [
      "paused",
      "failed",
      "downloaded",
    ] satisfies MediaItemState[];

    for (const propagableState of propagableStates) {
      if (parent.state === propagableState) {
        continue;
      }

      const childrenStateCount = childrenStateCountMap[propagableState];

      if (!childrenStateCount) {
        continue;
      }

      if (childrenStateCount === children.length) {
        return propagableState;
      }
    }

    if (childrenStateCountMap.completed === children.length) {
      return parent instanceof Show && parent.status === "continuing"
        ? "ongoing"
        : "completed";
    }

    if (
      childrenStateCountMap.ongoing ||
      childrenStateCountMap.unreleased ||
      (parent instanceof Show && parent.status === "continuing")
    ) {
      return "ongoing";
    }

    if (
      childrenStateCountMap.completed ||
      childrenStateCountMap.partially_completed
    ) {
      return "partially_completed";
    }

    return null;
  }

  async #maybeUpdateState(
    entity: MediaItem,
    changeSet: ChangeSet<Partial<MediaItem>> | null,
    uow: UnitOfWork,
    nextStatesMap: NextStatesMap,
  ): Promise<boolean> {
    const nextState = await this.#computeNextState(entity, nextStatesMap);

    if (nextState === entity.state) {
      return false;
    }

    entity.state = nextState;

    nextStatesMap.set(entity, nextState);

    if (changeSet) {
      uow.recomputeSingleChangeSet(entity);
    } else {
      uow.computeChangeSet(entity);
    }

    return true;
  }

  #computeStateWithChildren(
    item: Show | Season,
    children: (Season | Episode)[],
    nextStatesMap: NextStatesMap,
  ): Promisable<MediaItemState> {
    return (
      this.#determineFixedState(item) ??
      this.#determineParentStateFromChildren(item, children, nextStatesMap) ??
      this.#computeState(item)
    );
  }

  async #computeState(item: MediaItem): Promise<MediaItemState> {
    if (this.#determineFixedState(item)) {
      return item.state;
    }

    if (item instanceof Episode || item instanceof Movie) {
      const filesystemEntries = await item.filesystemEntries.loadItems();
      const hasMediaEntry = filesystemEntries.some(
        (entry) => entry.type === "media",
      );

      if (hasMediaEntry) {
        return "downloaded";
      }
    }

    const blacklistedStreams = new Set(
      await item.blacklistedStreams.loadItems(),
    );

    const streams = await item.streams.loadItems();

    const hasAvailableStreams = streams.some(
      (stream) => !blacklistedStreams.has(stream),
    );

    if (hasAvailableStreams) {
      return "scraped";
    }

    if (item.airedAt && DateTime.fromJSDate(item.airedAt) > DateTime.now()) {
      return "unreleased";
    }

    return "indexed";
  }
}
