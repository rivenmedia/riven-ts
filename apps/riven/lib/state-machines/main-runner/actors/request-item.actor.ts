import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import { fromPromise } from "xstate";

import { services } from "../../../database/database.ts";

import type { MainRunnerMachineEvent } from "../index.ts";
import type { ItemRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/item-requested.event";
import type { ActorRef, Snapshot } from "xstate";

export interface RequestItemInput {
  parentRef: ActorRef<Snapshot<unknown>, MainRunnerMachineEvent>;
  item: ItemRequestedEvent["item"];
}

export const requestItem = fromPromise<undefined, RequestItemInput>(
  async ({ input }) => {
    try {
      const itemRequest =
        input.item.type === "movie"
          ? await services.itemRequestService.requestMovie(input.item)
          : await services.itemRequestService.requestShow(input.item);

      input.parentRef.send({
        type: "riven.item-request.create.success",
        item: itemRequest.item,
      });
    } catch (error) {
      if (
        error instanceof ItemRequestCreateError ||
        error instanceof ItemRequestCreateErrorConflict
      ) {
        input.parentRef.send(error.payload);

        return;
      }

      throw error;
    }
  },
);
