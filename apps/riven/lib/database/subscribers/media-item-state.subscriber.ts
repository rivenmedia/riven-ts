import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import { DateTime } from "luxon";

import type {
  ChangeSet,
  EventSubscriber,
  FlushEventArgs,
  UnitOfWork,
} from "@mikro-orm/core";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

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
      if (collection.owner instanceof MediaItem) {
        trackedItems.set(collection.owner, null);
      }
    }

    const seasonsAwaitingUpdate = new Set<Season>();
    const showsAwaitingUpdate = new Set<Show>();
    const nextStatesMap = new Map<MediaItem, MediaItemState>();

    // Process direct updates from the unit of work
    for (const [item, changeSet] of trackedItems) {
      await this.#updateState(item, changeSet, uow, nextStatesMap);

      if (item instanceof Season || item instanceof Episode) {
        showsAwaitingUpdate.add(await item.getShow());
      }

      if (item instanceof Episode) {
        seasonsAwaitingUpdate.add(await item.season.loadOrFail());
      }
    }

    // Handle season state propagation
    for (const season of seasonsAwaitingUpdate) {
      await this.#updateState(season, null, uow, nextStatesMap);
    }

    // Handle show state propagation
    for (const show of showsAwaitingUpdate) {
      await this.#updateState(show, null, uow, nextStatesMap);
    }
  }

  #computeNextState(
    entity: MediaItem,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ): Promise<MediaItemState> {
    if (entity instanceof Season) {
      return this.#computeSeasonState(entity, nextStatesMap);
    }

    if (entity instanceof Show) {
      return this.#computeShowState(entity, nextStatesMap);
    }

    return this.#computeState(entity);
  }

  async #updateState(
    entity: MediaItem,
    changeSet: ChangeSet<Partial<MediaItem>> | null,
    uow: UnitOfWork,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ) {
    const nextState = await this.#computeNextState(entity, nextStatesMap);

    if (nextState === entity.state) {
      return;
    }

    entity.state = nextState;

    nextStatesMap.set(entity, nextState);

    if (changeSet) {
      uow.recomputeSingleChangeSet(entity);
    } else {
      uow.computeChangeSet(entity);
    }
  }

  async #computeShowState(
    show: Show,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ): Promise<MediaItemState> {
    if (show.state === "paused" || show.state === "failed") {
      return show.state;
    }

    const seasons = await show.seasons.loadItems();
    const seasonStateCountMap = seasons.reduce<
      Partial<Record<MediaItemState, number>>
    >((acc, season) => {
      const seasonState = nextStatesMap.get(season) ?? season.state;

      return {
        ...acc,
        [seasonState]: (acc[seasonState] ?? 0) + 1,
      };
    }, {});

    if (seasonStateCountMap.downloaded === seasons.length) {
      return "downloaded";
    }

    if (seasonStateCountMap.completed === seasons.length) {
      return "completed";
    }

    if (
      seasonStateCountMap.completed &&
      seasonStateCountMap.completed > 0 &&
      seasonStateCountMap.completed < seasons.length
    ) {
      return "partially_completed";
    }

    return this.#computeState(show);
  }

  async #computeSeasonState(
    season: Season,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ): Promise<MediaItemState> {
    if (season.state === "paused" || season.state === "failed") {
      return season.state;
    }

    const episodes = await season.episodes.loadItems();
    const episodeStateCountMap = episodes.reduce<
      Partial<Record<MediaItemState, number>>
    >((acc, episode) => {
      const episodeState = nextStatesMap.get(episode) ?? episode.state;

      return {
        ...acc,
        [episodeState]: (acc[episodeState] ?? 0) + 1,
      };
    }, {});

    // If all episodes are downloaded, season is downloaded
    if (episodeStateCountMap.downloaded === episodes.length) {
      return "downloaded";
    }

    if (episodeStateCountMap.completed === episodes.length) {
      return "completed";
    }

    if (
      episodeStateCountMap.completed &&
      episodeStateCountMap.completed > 0 &&
      episodeStateCountMap.completed < episodes.length
    ) {
      return "partially_completed";
    }

    return this.#computeState(season);
  }

  async #computeState(item: MediaItem): Promise<MediaItemState> {
    if (item.state === "paused" || item.state === "failed") {
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
