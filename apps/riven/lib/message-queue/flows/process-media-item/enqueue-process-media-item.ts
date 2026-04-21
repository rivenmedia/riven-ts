import { toMerged } from "es-toolkit";

import { services } from "../../../database/database.ts";
import { flow } from "../producer.ts";
import {
  ProcessMediaItemFlow,
  createProcessMediaItemJob,
} from "./process-media-item.schema.ts";

import type { FlowJob } from "bullmq";
import type { UUID } from "node:crypto";
import type { PartialDeep } from "type-fest";

export interface EnqueueProcessMediaItemInput {
  id: UUID;
  step?: ProcessMediaItemFlow["input"]["step"];
}

export async function enqueueProcessMediaItem(
  { id, step = "scrape" }: EnqueueProcessMediaItemInput,
  opts: FlowJob["opts"] = {},
) {
  const mediaItemsToProcess =
    await services.mediaItemService.getItemsToProcess(id);

  const rootNodes = mediaItemsToProcess.map((mediaItem) =>
    createProcessMediaItemJob(
      `Processing - ${mediaItem.fullTitle}`,
      {
        step,
        mediaItem,
      },
      {
        opts: toMerged<typeof opts, PartialDeep<NonNullable<FlowJob["opts"]>>>(
          opts,
          {
            deduplication: {
              id: `process-${mediaItem.type}-${mediaItem.id}`,
            },
          },
        ),
      },
    ),
  );

  return flow.addBulk(rootNodes);
}
