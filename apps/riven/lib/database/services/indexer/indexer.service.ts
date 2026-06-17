import { Movie, type Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";

import { settings } from "../../../utilities/settings.ts";
import { BaseService } from "../core/base-service.ts";
import {
  type MovieIndexData,
  persistMovieIndexerData,
} from "./utilities/persist-movie-indexer-data.ts";
import {
  type ShowIndexData,
  persistShowIndexerData,
} from "./utilities/persist-show-indexer-data.ts";

export class IndexerService extends BaseService {
  @EnsureRequestContext()
  @Transactional()
  private async indexMovie(item: MovieIndexData) {
    return persistMovieIndexerData(this.em, item);
  }

  @EnsureRequestContext()
  @Transactional()
  private async indexShow(item: ShowIndexData) {
    return persistShowIndexerData(this.em, item);
  }

  async indexItem(item: MovieIndexData): Promise<Movie>;
  async indexItem(item: ShowIndexData): Promise<Show>;
  async indexItem(item: MovieIndexData | ShowIndexData): Promise<Movie | Show>;
  @CreateRequestContext()
  async indexItem(item: MovieIndexData | ShowIndexData) {
    switch (item.type) {
      case "movie":
        return this.indexMovie(item);
      case "show":
        return this.indexShow(item);
    }
  }

  calculateReindexTime(item: Movie | Show): {
    reindexTime: DateTime;
    isFallback: boolean;
  } {
    const { scheduleOffsetMinutes, unknownAirDateOffsetDays } =
      settings.settings;

    const baseDate =
      item instanceof Movie ? item.releaseDate : item.nextAirDate;

    const reindexTime = baseDate
      ? DateTime.fromJSDate(baseDate).plus({
          minutes: scheduleOffsetMinutes,
        })
      : DateTime.utc().plus({ days: unknownAirDateOffsetDays });

    return {
      reindexTime,
      isFallback: !baseDate,
    };
  }
}
