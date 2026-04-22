import {
  MediaItemDownloadProviderListRequestedEvent,
  MediaItemDownloadProviderListRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.provider-list-requested.event";

import { runSingleJob } from "../../../../../../../utilities/run-single-job.ts";
import { flow } from "../../../../../../producer.ts";

import type { ParentOptions } from "bullmq";

export async function getPluginProviderList(
  pluginName: string,
  parent: ParentOptions,
) {
  const pluginProviderListNode = await flow.addPluginJob(
    MediaItemDownloadProviderListRequestedEvent,
    MediaItemDownloadProviderListRequestedResponse,
    `Get provider list for ${pluginName}`,
    pluginName,
    {},
    {
      jobId: `get-${pluginName}-provider-list`,
      removeDependencyOnFailure: true,
      parent,
    },
  );

  const pluginProviderListResult = await runSingleJob(
    pluginProviderListNode.job,
  );

  return pluginProviderListResult.providers;
}
