import { toMerged } from "es-toolkit";

import { services } from "../../../database/database.ts";
import { logger } from "../../../utilities/logger/logger.ts";
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
  /**
   * If `true`, jobs will be enqueued dynamically depending on the state of the item and its children.
   *
   * If `false`, only the specified item will be enqueued for processing.
   *
   * @default `true`
   */
  fanOut?: boolean;
}

export async function enqueueProcessMediaItem(
  {
    id,
    step = "scrape",
    isRootItem = true,
    fanOut = true,
  }: EnqueueProcessMediaItemInput,
  opts: FlowJob["opts"] = {},
) {
  const mediaItemsToProcess = fanOut
    ? await services.mediaItemService.getItemsToProcess(id)
    : [await services.mediaItemService.getMediaItemById(id)];

  if (mediaItemsToProcess.length === 0) {
    const { fullTitle } = await services.mediaItemService.getMediaItemById(id);

    logger.verbose(`No media items require processing for ${fullTitle}.`);

    return;
  }

  const rootNodes: FlowJob[] = [];

  for (const mediaItem of mediaItemsToProcess) {
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
              id: `process-${mediaItem.type}-${mediaItem.id}`,
            },
          }),
        },
      ),
    );
  }

  return flow.addBulk(rootNodes);
}
