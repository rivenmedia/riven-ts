import { clearDeduplicationJob } from "#message-queue/utilities/clear-deduplication-job.ts";
import { logger } from "#utilities/logger/logger.ts";

import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

export async function clearProcessingJobs(items: MediaItem[]) {
  for (const item of items) {
    const wasCleared = await clearDeduplicationJob(
      "process-media-item",
      `process-${item.type}-${item.id}`,
    );

    if (wasCleared) {
      logger.silly(
        `Removed existing media item processing job for ${item.fullTitle}`,
      );
    }
  }
}
