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
  async #shouldFanOut(item: MediaItem) {
    const { settings } = await import("../../../utilities/settings.ts");

    const isPartialRequest = item.itemRequest.getProperty("isPartialRequest");

    if (isPartialRequest) {
      return true;
    }

    const isOngoingShow = item instanceof Show && item.state === "ongoing";

    if (isOngoingShow) {
      return true;
    }

    return settings.preferSeasonPacks;
  }

  @CreateRequestContext()
  public async getMediaItemById<
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
  public async getItemsToProcess(id: UUID) {
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

      if (await this.#shouldFanOut(item)) {
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
  public async resetMediaItem(target: MediaItem) {
    return resetMediaItem(this.em, target);
  }
}
