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

    const parentsNeedingUpdate = new Set<Season | Show>();
    const nextStatesMap = new Map<MediaItem, MediaItemState>();

    // Process direct updates from the unit of work
    for (const [item, changeSet] of trackedItems) {
      const nextState = await this.#computeState(item);

      if (nextState === item.state) {
        continue;
      }

      item.state = nextState;

      nextStatesMap.set(item, nextState);

      if (item instanceof Season || item instanceof Episode) {
        parentsNeedingUpdate.add(await item.getShow());
      }

      if (item instanceof Episode) {
        parentsNeedingUpdate.add(await item.season.loadOrFail());
      }

      if (changeSet) {
        uow.recomputeSingleChangeSet(item);
      } else {
        uow.computeChangeSet(item);
      }
    }

    const seasonsToProcess: Season[] = [];

    for (const item of parentsNeedingUpdate) {
      if (item instanceof Season) {
        seasonsToProcess.push(item);
      }
    }

    // Process season state updates
    for (const season of seasonsToProcess) {
      const nextState = await this.#computeSeasonState(season, nextStatesMap);

      if (nextState === season.state) {
        continue;
      }

      season.state = nextState;

      nextStatesMap.set(season, nextState);

      const existingChangeSet = uow
        .getChangeSets()
        .find((cs) => cs.entity === season);

      if (existingChangeSet) {
        uow.recomputeSingleChangeSet(season);
      } else {
        uow.computeChangeSet(season);
      }
    }

    const showsToProcess = new Set<Show>();

    for (const item of parentsNeedingUpdate) {
      if (item instanceof Show) {
        showsToProcess.add(item);
      } else if (item instanceof Season) {
        showsToProcess.add(await item.getShow());
      }
    }

    // Process show state updates
    for (const show of showsToProcess) {
      const nextState = await this.#computeShowState(show, nextStatesMap);

      if (nextState === show.state) {
        continue;
      }

      show.state = nextState;

      nextStatesMap.set(show, nextState);

      const existingChangeSet = uow
        .getChangeSets()
        .find((cs) => cs.entity === show);

      if (existingChangeSet) {
        uow.recomputeSingleChangeSet(show);
      } else {
        uow.computeChangeSet(show);
      }
    }
  }

  async #computeSeasonState(
    season: Season,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ): Promise<MediaItemState> {
    if (season.state === "paused" || season.state === "failed") {
      return season.state;
    }

    const episodes = await season.episodes.loadItems();

    // If all episodes are downloaded, season is downloaded
    if (
      episodes.length > 0 &&
      episodes.every((episode) => {
        const nextState = nextStatesMap.get(episode);
        return (nextState ?? episode.state) === "downloaded";
      })
    ) {
      return "downloaded";
    }

    return this.#computeState(season);
  }

  async #computeShowState(
    show: Show,
    nextStatesMap: Map<MediaItem, MediaItemState>,
  ): Promise<MediaItemState> {
    if (show.state === "paused" || show.state === "failed") {
      return show.state;
    }

    const seasons = await show.seasons.loadItems();

    // If all seasons are downloaded, show is downloaded
    if (
      seasons.length > 0 &&
      seasons.every((season) => {
        const nextState = nextStatesMap.get(season);
        return (nextState ?? season.state) === "downloaded";
      })
    ) {
      return "downloaded";
    }

    return this.#computeState(show);
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
