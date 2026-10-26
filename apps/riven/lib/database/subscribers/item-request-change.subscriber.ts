import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import { getExternalIdTopics, pubSub } from "#graphql/pubsub.ts";

import type {
  EntityManager,
  EntityName,
  EventArgs,
  EventSubscriber,
  TransactionEventArgs,
} from "@mikro-orm/core";

/**
 * Publishes an `ITEM_REQUEST_CHANGED` event for each item request that is created, updated or removed,
 * once the transaction persisting it has committed, so subscribers never see uncommitted data.
 *
 * Changes are collected per entity manager as they are persisted, as an explicit transaction's change sets
 * are cleared when its flush completes, before the transaction commits.
 * Changes made in a nested transaction are published when its savepoint is released.
 */
export class ItemRequestChangeSubscriber implements EventSubscriber<ItemRequest> {
  readonly #pendingChanges = new WeakMap<EntityManager, Set<ItemRequest>>();

  public getSubscribedEntities(): EntityName<ItemRequest>[] {
    return [ItemRequest];
  }

  public afterCreate(args: EventArgs<ItemRequest>) {
    this.#trackChange(args);
  }

  public afterUpdate(args: EventArgs<ItemRequest>) {
    this.#trackChange(args);
  }

  public afterDelete(args: EventArgs<ItemRequest>) {
    this.#trackChange(args);
  }

  public afterTransactionCommit({ em }: TransactionEventArgs) {
    const changes = this.#pendingChanges.get(em);

    if (!changes) {
      return;
    }

    this.#pendingChanges.delete(em);

    for (const itemRequest of changes) {
      for (const topic of getExternalIdTopics(itemRequest)) {
        pubSub.publish("ITEM_REQUEST_CHANGED", topic, itemRequest.id);
      }
    }
  }

  public afterTransactionRollback({ em }: TransactionEventArgs) {
    this.#pendingChanges.delete(em);
  }

  #trackChange({ em, entity }: EventArgs<ItemRequest>) {
    const changes = this.#pendingChanges.get(em) ?? new Set<ItemRequest>();

    changes.add(entity);

    this.#pendingChanges.set(em, changes);
  }
}
