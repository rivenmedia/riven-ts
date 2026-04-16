import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const itemRequestUpdatedListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const item of pubSub.subscribe("ITEM_REQUEST_UPDATED")) {
      yield {
        type: "riven.item-request.update.success" as const,
        item,
      };
    }
  }

  return from(listen());
});
