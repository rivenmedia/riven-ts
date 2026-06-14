import { toMerged } from "es-toolkit";

import { services } from "../../../database/database.ts";
import { enqueueDownloadItem } from "../process-media-item/steps/download/enqueue-download-item.ts";
import { flow } from "../producer.ts";
import { createManualScrapeJob } from "./manual-scrape.schema.ts";

import type { Stream } from "@repo/util-plugin-sdk/dto/entities";
import type { FlowJob } from "bullmq";
import type { UUID } from "node:crypto";
import type { PartialDeep } from "type-fest";

export interface EnqueueManualScrapeInput {
  id: UUID;
  stream: Stream;
}

export async function enqueueManualScrape(
  { id, stream }: EnqueueManualScrapeInput,
  opts: FlowJob["opts"] = {},
) {
  const mediaItem = await services.mediaItemService.getMediaItemById(id);

  const { rootNode: downloadItemNode } = enqueueDownloadItem({
    item: mediaItem,
    opts: {},
    streams: [stream],
  });

  const rootNode = createManualScrapeJob(
    mediaItem.fullTitle,
    {
      mediaItem: {
        id: mediaItem.id,
        type: mediaItem.type,
        fullTitle: mediaItem.fullTitle,
      },
    },
    {
      children: [downloadItemNode],
      opts: toMerged<typeof opts, PartialDeep<NonNullable<FlowJob["opts"]>>>(
        opts,
        {
          deduplication: {
            id: `manual-scrape-${mediaItem.type}-${mediaItem.id}`,
          },
        },
      ),
    },
  );

  return {
    rootNode,
    enqueue: () => flow.add(rootNode),
  };
}
