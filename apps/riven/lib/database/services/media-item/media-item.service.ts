import { MediaItem, Show } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { services } from "../../database.ts";
import { BaseService } from "../core/base-service.ts";

import type { FilterQuery, FindOneOrFailOptions } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

export class MediaItemService extends BaseService {
  @CreateRequestContext()
  async getMediaItem<
    Hint extends string = never,
    Fields extends string = never,
    Excludes extends string = never,
  >(
    where: FilterQuery<MediaItem>,
    options?: FindOneOrFailOptions<MediaItem, Hint, Fields, Excludes>,
  ) {
    return this.em.getRepository(MediaItem).findOneOrFail(where, options);
  }

  @CreateRequestContext()
  async getItemsToProcess(id: UUID) {
    try {
      const item = await this.getMediaItem(
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
}
