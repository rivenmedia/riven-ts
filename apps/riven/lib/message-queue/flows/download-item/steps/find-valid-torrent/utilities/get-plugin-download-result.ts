import {
  MediaItemDownloadRequestedEvent,
  MediaItemDownloadRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download-requested.event";

import { runSingleJob } from "../../../../../utilities/run-single-job.ts";
import { flow } from "../../../../producer.ts";

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
