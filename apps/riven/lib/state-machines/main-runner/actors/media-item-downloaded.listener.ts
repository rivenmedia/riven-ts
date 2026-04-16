import { from } from "rxjs";
import { type NonReducibleUnknown, fromEventObservable } from "xstate";

import { pubSub } from "../../../graphql/pub-sub.ts";

import type { MainRunnerMachineEvent } from "../index.ts";

export const mediaItemDownloadedListener = fromEventObservable<
  MainRunnerMachineEvent,
  NonReducibleUnknown
>(() => {
  async function* listen() {
    for await (const {
      downloader,
      durationFromRequestToDownload,
      item,
      provider,
    } of pubSub.subscribe("MEDIA_ITEM_DOWNLOADED")) {
      yield {
        type: "riven.media-item.download.success",
        item,
        downloader,
        provider,
        durationFromRequestToDownload,
      } as const satisfies MainRunnerMachineEvent;
    }
  }

  return from(listen());
});
