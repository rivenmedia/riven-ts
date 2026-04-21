import { ItemRequest } from "@repo/util-plugin-sdk/dto/entities";

import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { persistRequestedMovie } from "./utilities/persist-requested-movie.ts";
import { persistRequestedShow } from "./utilities/persist-requested-show.ts";

import type { ContentServiceRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/content-service-requested.event";
import type { UUID } from "node:crypto";

export class ItemRequestService extends BaseService {
  @CreateRequestContext()
  @Transactional()
  async requestMovie(item: ContentServiceRequestedResponse["movies"][number]) {
    const { logger } = await import("../../../utilities/logger/logger.ts");

    const externalIds = [
      item.imdbId ? `IMDB: ${item.imdbId}` : null,
      item.tmdbId ? `TMDB: ${item.tmdbId}` : null,
    ].filter(Boolean);

    logger.silly(`Processing requested movie: ${externalIds.join(", ")}`);

    return persistRequestedMovie(this.em, item);
  }

  @CreateRequestContext()
  @Transactional()
  async requestShow(item: ContentServiceRequestedResponse["shows"][number]) {
    const { logger } = await import("../../../utilities/logger/logger.ts");

    const externalIds = [
      item.imdbId ? `IMDB: ${item.imdbId}` : null,
      item.tvdbId ? `TVDB: ${item.tvdbId}` : null,
    ].filter(Boolean);

    logger.silly(`Processing requested show: ${externalIds.join(", ")}`);

    return persistRequestedShow(this.em, item);
  }

  @CreateRequestContext()
  async getItemRequest(id: UUID) {
    return this.em.findOneOrFail(ItemRequest, { id });
  }
}
