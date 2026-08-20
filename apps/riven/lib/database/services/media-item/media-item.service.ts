import {
  Episode,
  MediaItem,
  Movie,
  Season,
} from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { settings } from "../../../utilities/settings.ts";
import { services } from "../../database.ts";
import { BaseService } from "../core/base-service.ts";
import { resetMediaItem } from "./utilities/reset-media-item.ts";

import type { FindOneOrFailOptions } from "@mikro-orm/core";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { UUID } from "node:crypto";

export class MediaItemService extends BaseService {
  readonly #rootItemTypes = new Set<MediaItemType>([
    "movie",
    settings.preferSeasonPacks ? "season" : "show",
  ]);

  public get rootItemTypes() {
    return new Set(this.#rootItemTypes);
  }

  #shouldFanOut(item: MediaItem) {
    if (item instanceof Movie || item instanceof Episode) {
      // No fan-out necessary for movies or individual episodes,
      // as they are the leaf nodes in the media item hierarchy
      return false;
    }

    if (item instanceof Season) {
      return item.state === "partially_completed";
    }

    const isPartialRequest = item.itemRequest.getProperty("isPartialRequest");

    if (isPartialRequest) {
      return true;
    }

    const isOngoingShow = item.itemRequest.getProperty("state") === "ongoing";

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

      if (this.#shouldFanOut(item)) {
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

  @EnsureRequestContext()
  public async getPaginatedMediaItems({
    filter = ["movie", "show"],
    includeUnrequestedItems = false,
    before,
    after,
    itemsPerPage = 25,
  }: {
    filter?: MediaItemType[];
    includeUnrequestedItems?: boolean;
    before?: string | null;
    after?: string | null;
    itemsPerPage?: number;
  } = {}) {
    if (before && after) {
      throw new Error(
        "Cannot specify both 'before' and 'after' cursors for pagination.",
      );
    }

    return this.em.findByCursor(MediaItem, {
      where: {
        type: { $in: filter },
        isRequested: {
          $in: [true, !includeUnrequestedItems],
        },
      },
      orderBy: [{ fullTitle: "ASC" }, { state: "ASC" }],
      ...(before ? { before, last: itemsPerPage } : {}),
      ...(after ? { after, first: itemsPerPage } : {}),
      ...(before == null && after == null ? { first: itemsPerPage } : {}),
    });
  }
}
