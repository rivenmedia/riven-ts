import { toMerged } from "es-toolkit";

import { flow } from "../producer.ts";
import {
  ProcessMediaItemFlow,
  createProcessMediaItemJob,
} from "./process-media-item.schema.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep } from "type-fest";

export interface EnqueueProcessMediaItemInput {
  item: MediaItem;
  step?: ProcessMediaItemFlow["input"]["step"];
}

export async function enqueueProcessMediaItem(
  { item, step = "scrape" }: EnqueueProcessMediaItemInput,
  opts: FlowJob["opts"] = {},
) {
  const rootNode = createProcessMediaItemJob(
    `Processing - ${item.fullTitle}`,
    {
      step,
      mediaItem: {
        id: item.id,
        type: item.type,
        title: item.fullTitle,
      },
    },
    {
      opts: toMerged<typeof opts, PartialDeep<NonNullable<FlowJob["opts"]>>>(
        opts,
        {
          deduplication: {
            id: `process-${item.type}-${item.id}`,
          },
        },
      ),
    },
  );

  return flow.add(rootNode);
}
