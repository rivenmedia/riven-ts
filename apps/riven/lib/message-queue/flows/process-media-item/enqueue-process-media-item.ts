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

export interface EnqueueProcessMediaItemInput extends Partial<
  Pick<ProcessMediaItemFlow["input"], "step" | "isRootItem">
> {
  id: UUID;
}

export async function enqueueProcessMediaItem(
  { id, step = "scrape", isRootItem = true }: EnqueueProcessMediaItemInput,
  opts: FlowJob["opts"] = {},
) {
  const mediaItemsToProcess =
    await services.mediaItemService.getItemsToProcess(id);

  const rootNodes = mediaItemsToProcess.map((mediaItem) =>
    createProcessMediaItemJob(
      mediaItem.fullTitle,
      {
        step,
        mediaItem,
        isRootItem,
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
