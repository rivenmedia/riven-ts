import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { flow } from "#message-queue/flows/producer.ts";
import { runSingleJob } from "#message-queue/utilities/run-single-job.ts";

import type { ParentOptions } from "bullmq";

export async function getPluginDownloadResult(
  infoHash: string,
  pluginName: string,
  provider: string | null,
  parent: ParentOptions,
) {
  const pluginDownloadNode = await flow.addPluginJob(
    MediaItemDownloadRequestedEvent,
    MediaItemDownloadRequestedResponse,
    [`Download ${infoHash}`, ...(provider ? [`using ${provider}`] : [])].join(
      " ",
    ),
    pluginName,
    { infoHash, provider },
    {
      jobId: [infoHash, pluginName, provider].filter(Boolean).join("-"),
      removeDependencyOnFailure: true,
      parent,
    },
  );

  return runSingleJob(pluginDownloadNode.job);
}
