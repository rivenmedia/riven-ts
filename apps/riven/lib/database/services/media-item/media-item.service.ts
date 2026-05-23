import { Episode, MediaItem, Show } from "@repo/util-plugin-sdk/dto/entities";

import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { services } from "../../database.ts";
import { BaseService } from "../core/base-service.ts";

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

  /**
   * Returns episodes belonging to the given show that should be processed as
   * part of a re-index follow-up. An episode qualifies if:
   *
   * - its parent season is requested and is not a "specials" season (number > 0)
   * - the episode itself is in state "indexed" or "scraped"
   *
   * Used by the main runner's reindex reaction branch (#160) to enqueue
   * per-episode jobs that dodge the season-level deduplication.
   */
  @CreateRequestContext()
  async getReindexEpisodesToProcess(showId: UUID) {
    return this.em.getRepository(Episode).find(
      {
        state: { $in: ["indexed", "scraped"] },
        season: {
          show: showId,
          isRequested: true,
          number: { $gt: 0 },
        },
      },
      { populate: ["season"] },
    );
  }
}
