import { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { toMerged } from "es-toolkit";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createProcessItemRequestJob } from "./process-item-request.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { PartialDeep } from "type-fest";

export interface ProcessItemRequestInput {
  item: ItemRequest;
  subscribers: RivenPlugin[];
}

export async function enqueueProcessItemRequest(
  { item, subscribers }: ProcessItemRequestInput,
  opts: FlowJob["opts"] = {},
) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemIndexRequestedEvent,
      `Index ${item.externalIdsLabel.join(" | ")}`,
      plugin.name.description ?? "unknown",
      { item },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const rootNode = createProcessItemRequestJob(
    `Indexing [${item.externalIdsLabel.join(" | ")}]`,
    {
      children: childNodes,
      opts: toMerged<
        NonNullable<FlowJob["opts"]>,
        PartialDeep<NonNullable<FlowJob["opts"]>>
      >(opts, {
        deduplication: {
          id: `process-item-request-${item.id}`,
        },
      }),
    },
  );

  return flow.add(rootNode);
}
