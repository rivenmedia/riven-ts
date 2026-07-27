import { toMerged } from "es-toolkit";

import { services } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { flow } from "../producer.ts";
import { createProcessMediaItemJob } from "./process-media-item.schema.ts";

import type { ProcessMediaItemFlow } from "./process-media-item.schema.ts";
import type { FlowJob } from "bullmq";
import type { UUID } from "node:crypto";
import type { PartialDeep } from "type-fest";

export interface EnqueueProcessMediaItemInput extends Partial<
  Pick<ProcessMediaItemFlow["input"], "step" | "isRootItem">
> {
  id: UUID;
  overwriteExistingJob?: boolean;
}

export async function enqueueProcessMediaItem(
  {
    id,
    step = "scrape",
    isRootItem = true,
    overwriteExistingJob = false,
  }: EnqueueProcessMediaItemInput,
  opts: FlowJob["opts"] = {},
) {
  const mediaItemsToProcess =
    await services.mediaItemService.getItemsToProcess(id);

  if (mediaItemsToProcess.length === 0) {
    const { fullTitle } = await services.mediaItemService.getMediaItemById(id);

    logger.verbose(`No media items require processing for ${fullTitle}.`);

    return;
  }

  const queue = createQueue("process-media-item");

  const rootNodes: FlowJob[] = [];

  for (const mediaItem of mediaItemsToProcess) {
    const deduplicationKey = `process-${mediaItem.type}-${mediaItem.id}`;
    const deduplicationId = await queue.getDeduplicationJobId(deduplicationKey);

    if (overwriteExistingJob && deduplicationId) {
      logger.verbose(
        `Removing existing media item processing job for ${mediaItem.fullTitle}`,
      );

      const deduplicationFlow = await flow.getFlow({
        id: deduplicationId,
        queueName: "process-media-item",
      });

      await deduplicationFlow.job.remove();
    }

    rootNodes.push(
      createProcessMediaItemJob(
        mediaItem.fullTitle,
        {
          step,
          mediaItem,
          isRootItem,
        },
        {
          opts: toMerged<
            typeof opts,
            PartialDeep<NonNullable<FlowJob["opts"]>>
          >(opts, {
            deduplication: {
              id: deduplicationKey,
            },
          }),
        },
      ),
    );
  }

  return flow.addBulk(rootNodes);
}
