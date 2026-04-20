import { toMerged } from "es-toolkit";

import { flow } from "../producer.ts";
import {
  ProcessItemFlow,
  createProcessItemJob,
} from "./process-item.schema.ts";

import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep } from "type-fest";

export interface EnqueueProcessItemInput extends Omit<
  ProcessItemFlow["input"],
  "requestId"
> {
  item: ItemRequest;
}

export async function enqueueProcessItem(
  { item, step = "index", scrapeLevel }: EnqueueProcessItemInput,
  opts: FlowJob["opts"] = {},
) {
  const rootNode = createProcessItemJob(
    `Processing [${item.externalIdsLabel.join(" | ")}]`,
    {
      step,
      requestId: item.id,
      scrapeLevel,
    },
    {
      opts: toMerged<typeof opts, PartialDeep<NonNullable<FlowJob["opts"]>>>(
        opts,
        {
          deduplication: {
            id: `process-item-${item.id}`,
          },
        },
      ),
    },
  );

  return flow.add(rootNode);
}
