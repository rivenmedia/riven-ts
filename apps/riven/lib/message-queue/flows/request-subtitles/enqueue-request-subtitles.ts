import { MediaItemSubtitleRequestedEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

import { logger } from "../../../utilities/logger/logger.ts";
import { createPluginFlowJob } from "../../utilities/create-flow-plugin-job.ts";
import { flow } from "../producer.ts";
import { createRequestSubtitlesJob } from "./request-subtitles.schema.ts";

import type { RivenPlugin } from "@repo/util-plugin-sdk";

export interface EnqueueRequestSubtitlesInput {
  item: MediaItemSubtitleRequestedEvent["item"];
  subscribers: RivenPlugin[];
}

export async function enqueueRequestSubtitles({
  item,
  subscribers,
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
    { id: item.id },
    { children: childNodes },
  );

  logger.silly(
    `Requesting subtitles for ${item.fullTitle} from ${subscribers.map((plugin) => plugin.name.description ?? "unknown").join(", ")}.`,
  );

  return flow.add(rootNode);
}
