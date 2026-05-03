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
  @Transactional()
  async saveSubtitles(mediaItemId: UUID, subtitles: Map<string, SubtitleData>) {
    return saveSubtitles(this.em, mediaItemId, subtitles);
  }
}
