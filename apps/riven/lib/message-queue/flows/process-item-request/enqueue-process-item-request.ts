import { toMerged } from "es-toolkit";

import { flow } from "../producer.ts";
import { createProcessItemRequestJob } from "./process-item-request.schema.ts";

import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep } from "type-fest";

export interface ProcessItemRequestInput {
  item: ItemRequest;
}

export async function enqueueProcessItemRequest(
  { item }: ProcessItemRequestInput,
  opts: FlowJob["opts"] = {},
) {
  const indexType = opts.delay ? "Reindexing" : "Indexing";

  const job = createProcessItemRequestJob(
    `${indexType} [${item.externalIdsLabel.join(" | ")}]`,
    {
      itemRequestId: item.id,
      step: "request",
    },
    {
      opts: toMerged<
        PartialDeep<NonNullable<FlowJob["opts"]>>,
        NonNullable<FlowJob["opts"]>
      >(
        {
          deduplication: {
            id: `process-item-request-${item.id}`,
          },
        },
        opts,
      ),
    },
  );

  return flow.add(job);
}
