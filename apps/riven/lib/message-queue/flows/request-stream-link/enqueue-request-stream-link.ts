import { flow } from "../producer.ts";
import {
  type RequestStreamLinkFlow,
  createRequestStreamLinkJob,
} from "./request-stream-link.schema.ts";

import type { TypedJobNode } from "bullmq";
import type { UUID } from "node:crypto";

export interface EnqueueRequestStreamLinkParams {
  mediaEntryId: UUID;
  mediaItemTitle: string;
}

export async function enqueueRequestStreamLink({
  mediaEntryId,
  mediaItemTitle,
}: EnqueueRequestStreamLinkParams): Promise<
  TypedJobNode<RequestStreamLinkFlow["input"], RequestStreamLinkFlow["output"]>
> {
  const job = createRequestStreamLinkJob(
    `Request stream link: ${mediaItemTitle}`,
    { mediaEntryId },
    {
      opts: {
        deduplication: {
          id: `request-stream-link-${mediaEntryId}`,
        },
      },
    },
  );

  return flow.add(job);
}
