import { flow } from "../producer.ts";
import {
  type RequestStreamLinkFlow,
  createRequestStreamLinkJob,
} from "./request-stream-link.schema.ts";

import type { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";
import type { TypedJobNode } from "bullmq";

export interface EnqueueRequestStreamLinkParams {
  mediaEntry: MediaEntry;
}

export async function enqueueRequestStreamLink({
  mediaEntry,
}: EnqueueRequestStreamLinkParams): Promise<
  TypedJobNode<RequestStreamLinkFlow["output"]>
> {
  const { fullTitle } = mediaEntry.mediaItem.unwrap();

  const job = createRequestStreamLinkJob(
    `Request stream link: ${fullTitle}`,
    { step: "validate-response", mediaEntry },
    {
      opts: {
        deduplication: {
          id: `request-stream-link-${mediaEntry.id}`,
        },
      },
    },
  );

  return flow.add(job);
}
