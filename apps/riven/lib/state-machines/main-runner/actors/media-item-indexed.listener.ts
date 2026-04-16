import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const mediaItemIndexedListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const item of pubSub.subscribe("MEDIA_ITEM_INDEXED")) {
      yield {
        type: "riven.media-item.index.success" as const,
        item,
      };
    }
  }

  return from(listen());
});
