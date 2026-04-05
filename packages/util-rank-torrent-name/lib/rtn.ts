import { rankTorrent } from "./ranker/rank.ts";
import {
  type CustomRank,
  type RankingModel,
  type Settings,
  type SettingsInput,
  createSettings,
  defaultRankingModel,
} from "./ranker/settings.ts";
import { sortTorrents } from "./ranker/sort.ts";
import { Resolution } from "./schemas.ts";

import type { Aliases } from "./ranker/lev.ts";
import type { RankedResult } from "./types.ts";

export class RTN {
  #settings: Settings;
  #rankingModel: RankingModel;
  #enabledResolutions: Set<Resolution>;

  constructor(
    settings: SettingsInput = {},
    rankingModel: RankingModel = defaultRankingModel,
  ) {
    this.#settings = createSettings(settings);

    this.#rankingModel = Object.values(this.#settings.customRanks).reduce(
      (acc, category) => {
        for (const [key, rank] of Object.entries(category) as [
          keyof RankingModel,
          CustomRank,
        ][]) {
          acc[key] = rank.rank ?? rankingModel[key];
        }

        return acc;
      },
      { ...rankingModel },
    );

    this.#enabledResolutions = new Set(
      Object.entries(this.#settings.resolutions)
        .filter(([_, enabled]) => enabled)
        .map(([res]) => Resolution.parse(res.replace(/^r/, ""))),
    );
  }

  rankTorrent(
    rawTitle: string,
    hash: string,
    correctTitle: string,
    aliases: Aliases,
  ) {
    return rankTorrent(
      rawTitle,
      hash,
      correctTitle,
      aliases,
      this.#settings,
      this.#rankingModel,
    );
  }

  sortTorrents(
    torrents: RankedResult[],
    bucketLimit = Infinity,
    resolutions = this.#enabledResolutions,
  ) {
    return sortTorrents(torrents, bucketLimit, resolutions);
  }
}
