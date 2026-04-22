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
  async getItemsToRetry() {
    return this.em.getRepository(MediaItem).find(
      {
        isRequested: true,
        state: {
          $in: ["indexed", "scraped", "partially_completed"],
        },
        type: {
          // Only retry movies and shows, as shows will fan out their seasons and episodes on failure
          $in: ["movie", "show"],
        },
      },
      {
        populate: ["activeStream", "streams"],
      },
    );
  }

  @CreateRequestContext()
  async getItemsToProcess(id: UUID) {
    const item = await this.getMediaItem(id);

    if (item instanceof Show) {
      // TODO: Add config var to control show packs vs season packs
      return services.downloaderService.getFanOutDownloadItems(id);
    }

    return [item];
  }
}
