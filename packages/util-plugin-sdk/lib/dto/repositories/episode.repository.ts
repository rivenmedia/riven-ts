import { MediaItemRepository } from "./media-item.repository.ts";

import type { Episode } from "../entities/index.ts";
import type { FilterQuery } from "@mikro-orm/core";

export class EpisodeRepository extends MediaItemRepository<Episode> {
  public async findAbsoluteEpisode(
    tvdbId: string,
    episodeNumber: number,
    seasonNumber: number | null,
  ) {
    const query = (
      seasonNumber === null
        ? {
            tvdbId,
            absoluteNumber: episodeNumber,
          }
        : {
            tvdbId,
            season: { number: seasonNumber },
            number: episodeNumber,
          }
    ) satisfies FilterQuery<Episode>;

    return this.findOne(query, {
      populate: ["$infer"],
    });
  }
}
