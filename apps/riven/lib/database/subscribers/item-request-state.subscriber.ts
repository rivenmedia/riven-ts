import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import type { EventSubscriber, FlushEventArgs } from "@mikro-orm/core";

export class ItemRequestStateSubscriber implements EventSubscriber {
  public async onFlush({ uow }: FlushEventArgs): Promise<void> {
    for (const changeSet of uow.getChangeSets()) {
      if (
        changeSet.entity instanceof Movie ||
        changeSet.entity instanceof Show
      ) {
        const itemRequest = await changeSet.entity.itemRequest.loadOrFail();

        switch (changeSet.entity.state) {
          case "completed":
          case "downloaded":
          case "indexed":
          case "partially_completed":
          case "paused":
          case "unknown":
          case "scraped": {
            itemRequest.state = "completed";

            break;
          }
          case "failed":
          case "ongoing":
          case "unreleased": {
            itemRequest.state = changeSet.entity.state;

            break;
          }
        }

        uow.computeChangeSet(itemRequest);
      }
    }
  }
}
