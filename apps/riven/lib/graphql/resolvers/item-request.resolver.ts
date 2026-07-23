import { Arg, ID, Mutation, Resolver } from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";

import type { UUID } from "node:crypto";

@Resolver()
export class ItemRequestResolver {
  @Mutation(() => Boolean)
  public async removeItemRequest(
    @Arg("id", () => ID) id: UUID,
    @CoreContext() { sendEvent, services: { itemRequestService } }: CoreContext,
  ): Promise<boolean> {
    const itemRequest = await itemRequestService.getItemRequestById(id);

    try {
      await itemRequestService.removeItemRequest(itemRequest);

      sendEvent({
        type: "riven.item-request.removed",
        item: itemRequest,
      });

      return true;
    } catch {
      return false;
    }
  }
}
