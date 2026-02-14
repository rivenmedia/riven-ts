import { rankTorrent } from "./ranker/rank.ts";
import {
  type RankingModel,
  type Settings,
  type SettingsInput,
  createSettings,
  defaultRankingModel,
} from "./ranker/settings.ts";
import { sortTorrents } from "./ranker/sort.ts";
import { Resolution } from "./schemas.js";

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
      (acc, category) => ({
        ...acc,
        ...Object.entries(category).reduce(
          (a, [key, rank]) => {
            return {
              ...a,
              [key as keyof RankingModel]:
                rank.rank ?? rankingModel[key as keyof RankingModel],
            };
          },
          {} as Record<keyof RankingModel, number>,
        ),
      }),
      {} as RankingModel,
    );

    this.#enabledResolutions = new Set(
      Object.entries(this.#settings.resolutions)
        .filter(([_, enabled]) => enabled)
        .map(([res]) => Resolution.parse(res.replace(/^r/, ""))),
    );
  }

  rankTorrent(rawTitle: string, hash: string, correctTitle: string) {
    return rankTorrent(
      rawTitle,
      hash,
      correctTitle,
      this.#settings,
      this.#rankingModel,
    );
  }

  sortTorrents(torrents: RankedResult[], bucketLimit = Infinity) {
    return sortTorrents(torrents, bucketLimit, this.#enabledResolutions);
  }
}
