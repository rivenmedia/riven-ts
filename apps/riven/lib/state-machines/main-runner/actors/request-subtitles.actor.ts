import { fromPromise } from "xstate";

import {
  type EnqueueRequestSubtitlesInput,
  enqueueRequestSubtitles,
} from "../../../message-queue/flows/process-media-item/steps/post-process/request-subtitles/enqueue-request-subtitles.ts";

export const requestSubtitles = fromPromise<
  undefined,
  EnqueueRequestSubtitlesInput
>(async ({ input }) => {
  await enqueueRequestSubtitles(input);
});
