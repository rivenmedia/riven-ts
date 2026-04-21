import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import { EnsureRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";

import type { UUID } from "node:crypto";

export class MediaItemService extends BaseService {
  @EnsureRequestContext()
  async getMediaItem(id: UUID) {
    return this.em.getRepository(MediaItem).findOneOrFail(id);
  }
}
