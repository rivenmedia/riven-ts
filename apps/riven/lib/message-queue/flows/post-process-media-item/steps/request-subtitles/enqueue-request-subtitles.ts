import { MediaItemSubtitleRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

import { createPluginFlowJob } from "../../../../utilities/create-flow-plugin-job.ts";
import { flow } from "../../../producer.ts";
import { createRequestSubtitlesJob } from "./request-subtitles.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";
import type { ParentOptions } from "bullmq";

export interface EnqueueRequestSubtitlesInput {
  item: MediaItemSubtitleRequestedEvent["item"];
  subscribers: RivenPlugin[];
  parent: ParentOptions;
}

export async function enqueueRequestSubtitles({
  item,
  subscribers,
  parent,
}: EnqueueRequestSubtitlesInput) {
  const childNodes = subscribers.map((plugin) =>
    createPluginFlowJob(
      MediaItemSubtitleRequestedEvent,
      `Request subtitles for ${item.fullTitle}`,
      plugin.name.description ?? "unknown",
      { item },
      { ignoreDependencyOnFailure: true },
    ),
  );

  const rootNode = createRequestSubtitlesJob(
    `Requesting subtitles for ${item.fullTitle}`,
    {
      mediaItem: {
        id: item.id,
        fullTitle: item.fullTitle,
      },
    },
    {
      children: childNodes,
      opts: { parent },
    },
  );

  return flow.add(rootNode);
}
