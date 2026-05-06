import { type ActorRef, type Snapshot, fromPromise } from "xstate";

import { services } from "../../../database/database.ts";

import type { MainRunnerMachineEvent } from "../index.ts";
import type { ItemRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/item-requested.event";

export interface RequestItemInput {
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
  item: ItemRequestedEvent["item"];
}

export const requestItem = fromPromise<undefined, RequestItemInput>(
  async ({ input }) => {
    if (input.item.type === "movie") {
      const itemRequest = await services.itemRequestService.requestMovie(
        input.item,
      );

      input.parentRef.send({
        type: "riven/item-request.create.success",
        item: itemRequest.item,
      });
    }

    if (input.item.type === "show") {
      const itemRequest = await services.itemRequestService.requestShow(
        input.item,
      );

      input.parentRef.send({
        type: "riven/item-request.create.success",
        item: itemRequest.item,
      });
    }
  },
);
