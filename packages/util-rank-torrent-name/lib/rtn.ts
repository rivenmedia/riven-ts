import { rankTorrent } from "./ranker/rank.ts";
import {
  DEFAULT_RANKING,
  type RankingModel,
  type Settings,
} from "./ranker/settings.ts";
import { sortTorrents } from "./ranker/sort.ts";

import type { Resolution } from "./types.ts";

export class RTN {
  #settings: Settings;
  #rankingModel: RankingModel;
  #enabledResolutions: Set<keyof typeof Resolution>;

  constructor(
    settings: Settings,
    rankingModel: RankingModel = DEFAULT_RANKING,
  ) {
    this.#settings = settings;
    this.#rankingModel = rankingModel;
    this.#enabledResolutions = new Set(
      Object.entries(settings.resolutions)
        .filter(([_, enabled]) => enabled)
        .map(([res]) => res.replace(/^r/, "") as keyof typeof Resolution),
    );
  }

  rankTorrent(rawTitle: string, hash: string) {
    return rankTorrent(rawTitle, hash, this.#settings, this.#rankingModel);
  }

  rankTorrents(
    torrents: Record<string, string>,
    bucketLimit = Infinity,
    resolutions = this.#enabledResolutions,
  ) {
    const rawMap = new Map(
      Object.entries(torrents).map(([hash, title]) => [
        hash,
        this.rankTorrent(title, hash),
      ]),
    );

    return sortTorrents(rawMap, bucketLimit, resolutions);
  }
}
