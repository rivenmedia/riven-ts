import { Movie, Show, Season } from "@repo/util-plugin-sdk/dto/entities";

import { wrap } from "@mikro-orm/core";

import type {
  EntityName,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
  UnitOfWork,
} from "@mikro-orm/core";
import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";

export class ItemRequestStateSubscriber implements EventSubscriber<
  Movie | Show
> {
  async #calculateItemRequestState(
    entity: Movie | Show,
  ): Promise<ItemRequestState> {
    if (
      entity instanceof Show &&
      entity.state !== "unreleased" &&
      entity.status === "continuing"
    ) {
      return "ongoing";
    }

    switch (entity.state) {
      case "partially_completed": {
        if (entity instanceof Show) {
          const wrappedEntity = wrap(entity);
          const { seasons } = await wrappedEntity.populate(["seasons"]);

          const incompleteSeasons = seasons.filter(
            (season) => season.isRequested && season.state !== "completed",
          );

          return incompleteSeasons.length > 0 ? "processing" : "completed";
        }

        throw new Error(
          "Movie entity should not be in a partially completed state",
        );
      }
      case "indexed":
      case "scraped":
      case "downloaded": {
        return "processing";
      }
      case "completed":
      case "paused":
      case "failed":
      case "unreleased": {
        return entity.state;
      }
    }
  }

  public getSubscribedEntities(): EntityName<Movie | Show>[] {
    return [Movie, Show];
  }

  public async beforeUpsert({ entity }: EventArgs<Movie | Show>) {
    const itemRequest = await entity.itemRequest.loadOrFail();

    if (
      entity instanceof Show &&
      entity.status === "ended" &&
      itemRequest.state === "ongoing"
    ) {
      itemRequest.state =
        entity.state === "completed" ? "completed" : "processing";
    } else {
      itemRequest.state = await this.#calculateItemRequestState(entity);
    }
  }

  #trackAndComputeChangeSet(
    itemRequest: ItemRequest,
    trackedItemRequests: Set<ItemRequest>,
    uow: UnitOfWork,
  ) {
    if (trackedItemRequests.has(itemRequest)) {
      uow.recomputeSingleChangeSet(itemRequest);
    } else {
      trackedItemRequests.add(itemRequest);

      uow.computeChangeSet(itemRequest);
    }
  }

  public async onFlush({ uow }: FlushEventArgs): Promise<void> {
    const trackedItemRequests = new Set<ItemRequest>();

    for (const { entity, originalEntity, payload } of uow.getChangeSets()) {
      if (
        !(
          entity instanceof Movie ||
          entity instanceof Show ||
          entity instanceof Season
        )
      ) {
        continue;
      }

      const isStateChange = payload["state"] !== undefined;

      if (
        isStateChange &&
        (entity instanceof Movie || entity instanceof Show)
      ) {
        const itemRequest = await entity.itemRequest.loadOrFail();

        itemRequest.state = await this.#calculateItemRequestState(entity);

        this.#trackAndComputeChangeSet(itemRequest, trackedItemRequests, uow);

        continue;
      }

      const isNewlyRequestedSeason =
        entity instanceof Season &&
        entity.isRequested &&
        entity.state === "indexed" &&
        originalEntity?.["isRequested"] === false;

      if (isNewlyRequestedSeason) {
        const itemRequest = await entity.itemRequest.loadOrFail();

        itemRequest.state = "processing";

        this.#trackAndComputeChangeSet(itemRequest, trackedItemRequests, uow);
      }
    }
  }
}
