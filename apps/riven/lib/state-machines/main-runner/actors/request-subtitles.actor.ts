import { fromPromise } from "xstate";

import {
  type EnqueueRequestSubtitlesInput,
  enqueueRequestSubtitles,
} from "../../../message-queue/flows/request-subtitles/enqueue-request-subtitles.ts";

export const requestSubtitles = fromPromise<
  undefined,
  EnqueueRequestSubtitlesInput
>(async ({ input }) => {
  await enqueueRequestSubtitles(input);
});
