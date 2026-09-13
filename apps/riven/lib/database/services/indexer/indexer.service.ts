import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";

import { BaseService } from "../core/base-service.ts";
import { persistMovieIndexerData } from "./utilities/persist-movie-indexer-data.ts";
import { persistShowIndexerData } from "./utilities/persist-show-indexer-data.ts";

import type { MovieIndexData } from "./utilities/persist-movie-indexer-data.ts";
import type { ShowIndexData } from "./utilities/persist-show-indexer-data.ts";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

interface IndexItemResponse<T extends Movie | Show> {
  item: T;
  isReindex: boolean;
  isAdditionalSeasonRequest?: boolean;
}

export class IndexerService extends BaseService {
  @EnsureRequestContext()
  @Transactional()
  private async indexMovie(
    item: MovieIndexData,
  ): Promise<IndexItemResponse<Movie>> {
    return persistMovieIndexerData(this.em, item);
  }

  @EnsureRequestContext()
  @Transactional()
  private async indexShow(
    item: ShowIndexData,
  ): Promise<IndexItemResponse<Show>> {
    return persistShowIndexerData(this.em, item);
  }

  public async indexItem(
    item: MovieIndexData,
  ): Promise<IndexItemResponse<Movie>>;
  public async indexItem(item: ShowIndexData): Promise<IndexItemResponse<Show>>;
  public async indexItem(
    item: MovieIndexData | ShowIndexData,
  ): Promise<IndexItemResponse<Movie> | IndexItemResponse<Show>>;
  @CreateRequestContext()
  public async indexItem(item: MovieIndexData | ShowIndexData) {
    switch (item.type) {
      case "movie": {
        return this.indexMovie(item);
      }
      case "show": {
        return this.indexShow(item);
      }
    }
  }

  public async calculateReindexTime(item: Movie | Show): Promise<
    {
      reindexTime: DateTime;
    } & (
      | { isReleaseDateInPast?: never; isReleaseDateKnown: false }
      | { isReleaseDateInPast: boolean; isReleaseDateKnown: true }
    )
  > {
    const { settings } = await import("../../../utilities/settings.ts");
    const baseDate =
      item instanceof Movie ? item.releaseDate : item.nextAirDate;

    // If no known release date is available, schedule the reindex for a fallback time in the future.
    if (!baseDate) {
      return {
        isReleaseDateKnown: false,
        reindexTime: DateTime.utc()
          .startOf("minute")
          .plus({ days: settings.unknownAirDateOffsetDays }),
      };
    }

    const now = DateTime.utc().startOf("minute");
    const releaseDateIsPast =
      DateTime.fromJSDate(baseDate).startOf("minute") < now;

    // If the release date is in the past, reindex on a shorter interval
    // to attempt to receive updated information.
    if (releaseDateIsPast) {
      return {
        isReleaseDateKnown: true,
        isReleaseDateInPast: true,
        reindexTime: now.plus({ minutes: settings.scheduleOffsetMinutes }),
      };
    }

    // If the item has a known release date, schedule the reindex shortly after the expected release.
    return {
      isReleaseDateKnown: true,
      isReleaseDateInPast: false,
      reindexTime: DateTime.fromJSDate(baseDate)
        .startOf("minute")
        .plus({ minutes: settings.scheduleOffsetMinutes }),
    };
  }
}
