import { getPluginEventSubscribers } from "../../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { enqueueRequestSubtitles } from "../steps/request-subtitles/enqueue-request-subtitles.ts";

import type { SubtitlesService } from "../../../../database/services/subtitles/subtitles.service.ts";
import type { ValidPluginMap } from "../../../../types/plugins.ts";
import type { ParentOptions } from "bullmq";
import type { UUID } from "node:crypto";

/**
 * Enqueues subtitle requests for a given media item if there are any relevant plugin subscribers.
 *
 * If there are no relevant plugin subscribers, this is a no-op.
 *
 * @param mediaItemId The ID of the media item
 * @param subtitlesService {@link SubtitlesService}
 * @param plugins The map of valid plugins
 * @param parent The parent job options for BullMQ
 * @returns A promise that resolves when subtitle requests have been enqueued for all relevant items
 */
export async function maybeEnqueueSubtitleRequests(
  mediaItemId: UUID,
  subtitlesService: SubtitlesService,
  plugins: ValidPluginMap,
  parent: ParentOptions,
) {
  const subtitlesSubscribers = getPluginEventSubscribers(
    "riven.media-item.subtitle.requested",
    plugins,
  );

  if (subtitlesSubscribers.length === 0) {
    return;
  }

  const items =
    await subtitlesService.getItemsForSubtitlesProcessing(mediaItemId);

  for (const item of items) {
    await enqueueRequestSubtitles({
      item,
      subscribers: subtitlesSubscribers,
      parent,
    });
  }
}
