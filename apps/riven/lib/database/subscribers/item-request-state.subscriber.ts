import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import type {
  EntityName,
  EventArgs,
  EventSubscriber,
  FlushEventArgs,
} from "@mikro-orm/core";

export class ItemRequestStateSubscriber implements EventSubscriber<
  Movie | Show
> {
  #calculateItemRequestState(entity: Movie | Show) {
    if (entity instanceof Show && entity.status === "continuing") {
      return "ongoing";
    }

    switch (entity.state) {
      case "indexed":
      case "scraped":
      case "partially_completed":
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
      itemRequest.state = this.#calculateItemRequestState(entity);
    }
  }

  public async onFlush({ uow }: FlushEventArgs): Promise<void> {
    for (const { entity, payload } of uow.getChangeSets()) {
      if (!payload["state"]) {
        continue;
      }

      if (entity instanceof Movie || entity instanceof Show) {
        const itemRequest = await entity.itemRequest.loadOrFail();

        itemRequest.state = this.#calculateItemRequestState(entity);

        uow.computeChangeSet(itemRequest);
      }
    }
  }
}
