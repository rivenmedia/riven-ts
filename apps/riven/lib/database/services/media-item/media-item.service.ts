import {
  Episode,
  MediaItem,
  Movie,
  Season,
  Show,
} from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { services } from "#database/database.ts";
import { BaseService } from "#database/services/core/base-service.ts";
import { settings } from "#utilities/settings.ts";

import { resetMediaItem } from "./utilities/reset-media-item.ts";

import type { FindOneOrFailOptions } from "@mikro-orm/core";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import type { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import type { UUID } from "node:crypto";

interface EpisodePosition {
  seasonNumber: number;
  episodeNumber: number;
}

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

  @EnsureRequestContext()
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

  /**
   * Finds a root media item by the external ID Riven uses to request it:
   * the TMDB ID for movies, and the TVDB ID for shows.
   */
  @EnsureRequestContext()
  public async getMediaItemByExternalId(
    externalId: string,
    type: TopLevelMediaItemType,
  ) {
    switch (type) {
      case "movie": {
        return this.em.getRepository(Movie).findOne({ tmdbId: externalId });
      }
      case "show": {
        return this.em.getRepository(Show).findOne({ tvdbId: externalId });
      }
    }
  }

  @EnsureRequestContext()
  public async getSeasonByShowTvdbId(showTvdbId: string, seasonNumber: number) {
    return this.em.getRepository(Season).findOne({
      tvdbId: showTvdbId,
      number: seasonNumber,
    });
  }

  @EnsureRequestContext()
  public async getEpisodeByShowTvdbId(
    showTvdbId: string,
    { seasonNumber, episodeNumber }: EpisodePosition,
  ) {
    return this.em.getRepository(Episode).findOne({
      tvdbId: showTvdbId,
      number: episodeNumber,
      season: { number: seasonNumber },
    });
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
      const { logger } = await import("#utilities/logger/logger.ts");

      logger.error("Unable to determine media items to process", {
        err: error,
      });

      return [];
    }
  }

  @EnsureRequestContext()
  @Transactional()
  public async resetMediaItem(target: MediaItem) {
    return resetMediaItem(this.em, target);
  }

  @EnsureRequestContext()
  public async getPaginatedMediaItems({
    search,
    filter = ["movie", "show"],
    state,
    includeUnrequestedItems = false,
    before,
    after,
    itemsPerPage = 25,
  }: {
    search?: string;
    filter?: MediaItemType[];
    state?: MediaItemState[];
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
        ...(state ? { state: { $in: state } } : {}),
        ...(search && { fullTitle: { $ilike: `%${search}%` } }),
      },
      orderBy: [{ fullTitle: "ASC" }, { state: "ASC" }],
      ...(before ? { before, last: itemsPerPage } : {}),
      ...(after ? { after, first: itemsPerPage } : {}),
      ...(before == null && after == null ? { first: itemsPerPage } : {}),
    });
  }
}
