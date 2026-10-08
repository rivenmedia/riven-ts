import { ItemRequestCreateErrorConflict } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.conflict.event";
import { ItemRequestCreateError } from "@repo/util-plugin-sdk/schemas/events/item-request.create.error.event";

import type { ItemRequestService } from "#database/services/item-request/item-request.service.ts";
import type { RequestedItem } from "#message-queue/flows/request-content-service/request-content-service.processor.ts";
import type { MainRunnerMachineIntake } from "#state-machines/main-runner/index.ts";

interface RequestItemsOptions {
  itemRequestService: ItemRequestService;
  sendEvent: MainRunnerMachineIntake;
  signal: AbortSignal | undefined;
}

export async function requestItems(
  items: Iterable<RequestedItem>,
  { itemRequestService, sendEvent, signal }: RequestItemsOptions,
) {
  let newItemsCount = 0;
  let updatedItemsCount = 0;

  for (const { item, type } of items) {
    signal?.throwIfAborted();

    try {
      const result =
        type === "show"
          ? await itemRequestService.requestShow(item)
          : await itemRequestService.requestMovie(item);

      if (result.requestType === "create") {
        newItemsCount += 1;
      } else {
        updatedItemsCount += 1;
      }

      sendEvent({
        type: `riven.item-request.${result.requestType}.success`,
        item: result.item,
      });
    } catch (error) {
      if (
        error instanceof ItemRequestCreateError ||
        error instanceof ItemRequestCreateErrorConflict
      ) {
        sendEvent(error.payload);
      }
    }
  }

  return { newItemsCount, updatedItemsCount };
}
