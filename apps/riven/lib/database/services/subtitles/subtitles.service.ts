import { MediaItem, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { saveSubtitles } from "./utilities/save-subtitles.ts";

import type { SubtitleData } from "@repo/util-plugin-sdk/schemas/events/media-item.subtitle-requested.event";
import type { UUID } from "node:crypto";

export class SubtitlesService extends BaseService {
  @CreateRequestContext()
  async getItemsForSubtitlesProcessing(id: UUID) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail({
      id,
      state: {
        $in: ["downloaded", "completed", "partially_completed", "ongoing"],
      },
    });

    if (item instanceof Show) {
      return item.getEpisodes();
    }

    if (item instanceof Season) {
      return item.episodes.loadItems();
    }

    return [item];
  }

  @CreateRequestContext()
  @Transactional()
  async saveSubtitles(mediaItemId: UUID, subtitles: Map<string, SubtitleData>) {
    return saveSubtitles(this.em, mediaItemId, subtitles);
  }
}
