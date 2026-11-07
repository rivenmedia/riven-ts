import {
  MediaItemDownloadProviderListRequestedEvent,
  MediaItemDownloadProviderListRequestedResponse,
} from "@repo/util-plugin-sdk/schemas/events/media-item.download.provider-list-requested.event";

import { flow } from "#message-queue/flows/producer.ts";
import { runSingleJob } from "#message-queue/utilities/run-single-job.ts";

export async function getPluginProviderList(pluginName: string) {
  const pluginProviderListNode = await flow.addPluginJob(
    MediaItemDownloadProviderListRequestedEvent,
    MediaItemDownloadProviderListRequestedResponse,
    `Get provider list for ${pluginName}`,
    pluginName,
    {},
    {
      deduplication: {
        id: `get-${pluginName}-provider-list`,
      },
      removeDependencyOnFailure: true,
      removeOnComplete: {
        age: 60,
      },
    },
  );

  const pluginProviderListResult = await runSingleJob(
    pluginProviderListNode.job,
  );

  return pluginProviderListResult;
}
