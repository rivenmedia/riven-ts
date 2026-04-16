import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const mediaItemScrapedListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const { item } of pubSub.subscribe("MEDIA_ITEM_SCRAPED")) {
      yield {
        type: "riven.media-item.scrape.success",
        item,
      } as const satisfies MainRunnerMachineEvent;
    }
  }

  return from(listen());
});
