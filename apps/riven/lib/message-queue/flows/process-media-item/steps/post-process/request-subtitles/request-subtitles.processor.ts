import { services } from "../../../../../../database/database.ts";
import { logger } from "../../../../../../utilities/logger/logger.ts";
import { requestSubtitlesProcessorSchema } from "./request-subtitles.schema.ts";

import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";

export const requestSubtitlesProcessor =
  requestSubtitlesProcessorSchema.implementAsync(async ({ job }) => {
    const data = await job.getChildrenValues();

    const allSubtitles = Object.values(data).flatMap<SubtitleData>(
      (childData) => childData.subtitles,
    );

    if (allSubtitles.length === 0) {
      logger.debug(`No subtitles returned for media item ID ${job.data.id}`);

      return { count: 0 };
    }

    // Deduplicate by language (first per language wins)
    const uniqueByLanguage = new Map<string, SubtitleData>();

    for (const subtitle of allSubtitles) {
      if (!uniqueByLanguage.has(subtitle.language)) {
        uniqueByLanguage.set(subtitle.language, subtitle);
      }
    }

    const count = await services.subtitlesService.saveSubtitles(
      job.data.id,
      uniqueByLanguage,
    );

    return { count };
  });
