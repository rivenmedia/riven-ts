import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const mediaItemStateChangeListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const { item, stateChange } of pubSub.subscribe(
      "MEDIA_ITEM_STATE_CHANGED",
    )) {
      yield {
        type: "state-change",
        item,
        stateChange,
      } as const satisfies MainRunnerMachineEvent;
    }
  }

  return from(listen());
});
