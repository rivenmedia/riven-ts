import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const itemRequestCreatedListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const item of pubSub.subscribe("ITEM_REQUEST_CREATED")) {
      yield {
        type: "riven.item-request.create.success" as const,
        item,
      };
    }
  }

  return from(listen());
});
