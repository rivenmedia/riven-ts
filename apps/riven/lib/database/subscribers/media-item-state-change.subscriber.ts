import {
  Episode,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import chalk from "chalk";

import { pubSub } from "#graphql/pubsub.ts";

import type {
  EntityManager,
  EntityName,
  EventArgs,
  EventSubscriber,
  TransactionEventArgs,
} from "@mikro-orm/core";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { UUID } from "node:crypto";

interface PendingStateChange {
  fullTitle: string;
  stateChange: [previousState: MediaItemState, nextState: MediaItemState];
}

interface PendingChanges {
  mediaItems: Map<UUID, PendingStateChange>;
  seasonIds: Set<UUID>;
}

/**
 * Publishes a `MEDIA_ITEM_STATE_CHANGED` event for each media item whose state changes, and a `SEASON_UPDATED` event
 * for each season whose state, or whose episodes' states, change, once the transaction persisting them has committed,
 * so subscribers never see uncommitted data.
 *
 * Changes are collected per entity manager as they are persisted, as an explicit transaction's change sets
 * are cleared when its flush completes, before the transaction commits.
 * Changes made in a nested transaction are published when its savepoint is released.
 */
export class MediaItemStateChangeSubscriber implements EventSubscriber<MediaItem> {
  readonly #pendingChanges = new WeakMap<EntityManager, PendingChanges>();

  public getSubscribedEntities(): EntityName<MediaItem>[] {
    return [Movie, Show, Season, Episode];
  }

  public afterUpdate({ em, entity, changeSet }: EventArgs<MediaItem>) {
    if (!changeSet?.originalEntity || !changeSet.payload.state) {
      return;
    }

    const changes: PendingChanges = this.#pendingChanges.get(em) ?? {
      mediaItems: new Map(),
      seasonIds: new Set(),
    };

    const previousState =
      changes.mediaItems.get(entity.id)?.stateChange[0] ??
      MediaItemState.parse(changeSet.originalEntity.state);

    changes.mediaItems.set(entity.id, {
      fullTitle: entity.fullTitle,
      stateChange: [
        previousState,
        MediaItemState.parse(changeSet.payload.state),
      ],
    });

    // A season's episode counts can change without its own state changing,
    // so a season is also updated whenever any of its episodes change state.
    if (entity instanceof Season) {
      changes.seasonIds.add(entity.id);
    }

    if (entity instanceof Episode) {
      changes.seasonIds.add(entity.season.id);
    }

    this.#pendingChanges.set(em, changes);
  }

  public async afterTransactionCommit({ em }: TransactionEventArgs) {
    const changes = this.#pendingChanges.get(em);

    if (!changes) {
      return;
    }

    this.#pendingChanges.delete(em);

    const { logger } = await import("#utilities/logger/logger.ts");

    for (const [
      id,
      {
        fullTitle,
        stateChange: [previousState, nextState],
      },
    ] of changes.mediaItems) {
      logger.debug(
        `${chalk.bold(fullTitle)} state change: ${chalk.red(previousState)} ${chalk.dim("→")} ${chalk.green(nextState)}`,
      );

      pubSub.publish("MEDIA_ITEM_STATE_CHANGED", id, id);
    }

    for (const seasonId of changes.seasonIds) {
      pubSub.publish("SEASON_UPDATED", seasonId, seasonId);
    }
  }

  public afterTransactionRollback({ em }: TransactionEventArgs) {
    this.#pendingChanges.delete(em);
  }
}
