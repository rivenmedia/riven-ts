import { EntityRepository, type FilterQuery } from "@mikro-orm/core";

import type { Episode } from "../entities/index.ts";

export class EpisodeRepository extends EntityRepository<Episode> {
  async findAbsoluteEpisode(
    tvdbId: string,
    episodeNumber: number,
    seasonNumber: number | undefined,
  ) {
    const query = (
      seasonNumber !== undefined
        ? {
            tvdbId,
            season: { number: seasonNumber },
            number: episodeNumber,
          }
        : {
            tvdbId,
            absoluteNumber: episodeNumber,
          }
    ) satisfies FilterQuery<Episode>;

    return this.findOne(query, {
      populate: ["$infer"],
    });
  }
}
