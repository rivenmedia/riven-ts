import { MediaItem, Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { services } from "../../database.ts";
import { BaseService } from "../core/base-service.ts";
import { resetMediaItem } from "./utilities/reset-media-item.ts";

import type { FindOneOrFailOptions } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

export class MediaItemService extends BaseService {
  @CreateRequestContext()
  async getMediaItemById<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    id: UUID,
    options?: FindOneOrFailOptions<MediaItem, Hint, Fields, Excludes>,
  ) {
    return this.em.getRepository(MediaItem).findOneOrFail(id, options);
  }

  @CreateRequestContext()
  async getItemsToProcess(id: UUID) {
    try {
      const item = await this.em.getRepository(MediaItem).findOneOrFail(
        {
          id,
          state: {
            $nin: ["failed", "paused"],
          },
        },
        { populate: ["itemRequest"] },
      );

      const { settings } = await import("../../../utilities/settings.ts");

      if (
        item.itemRequest.getProperty("isPartialRequest") ||
        (item instanceof Show &&
          (item.status === "continuing" || settings.preferSeasonPacks))
      ) {
        return await services.downloaderService.getFanOutDownloadItems(id);
      }

      return [item];
    } catch (error) {
      const { logger } = await import("../../../utilities/logger/logger.ts");

      logger.error("Unable to determine media items to process", {
        err: error,
      });

      return [];
    }
  }

  @CreateRequestContext()
  @Transactional()
  async resetMediaItem(target: MediaItem) {
    return resetMediaItem(this.em, target);
  }
}
