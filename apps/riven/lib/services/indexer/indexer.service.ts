import { type Movie, type Show } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../base-service.ts";
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
  @CreateRequestContext()
  async indexItem(item: MovieIndexData | ShowIndexData) {
    switch (item.type) {
      case "movie":
        return this.indexMovie(item);
      case "show":
        return this.indexShow(item);
    }
  }
}
