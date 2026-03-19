import { MediaItemIndexRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.index.requested.event";

import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createRequestIndexDataJob } from "./index-item.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";
import type { JobsOptions } from "bullmq";

export interface EnqueueIndexItemInput {
  item: ItemRequest;
  subscribers: RivenPlugin[];
}

export async function enqueueIndexItem(
  { item, subscribers }: EnqueueIndexItemInput,
  opts?: JobsOptions,
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

  const rootNode = createRequestIndexDataJob(
    `Indexing [${item.externalIdsLabel.join(" | ")}]`,
    {
      children: childNodes,
      opts: {
        deduplication: {
          id: `index-item-${item.id.toString()}`,
        },
        ...(opts ?? {}),
      },
    },
  );

  return flow.add(rootNode);
}
