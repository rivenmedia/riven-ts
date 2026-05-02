import { ItemRequest, MediaItem } from "@rivenmedia/plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";

export class RetryLibraryService extends BaseService {
  @CreateRequestContext()
  async getMediaItemsToRetry() {
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
  async getItemRequestsToRetry() {
    return this.em.getRepository(ItemRequest).find({
      state: {
        $in: ["failed", "requested"],
      },
    });
  }
}
