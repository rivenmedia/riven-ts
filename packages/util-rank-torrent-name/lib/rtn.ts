import { parse } from "./parser/parse.ts";
import { checkFetch } from "./ranker/fetch.ts";
import { rank } from "./ranker/rank.ts";
import {
  DEFAULT_RANKING,
  type RankingModel,
  type Settings,
} from "./ranker/settings.ts";
import { sortTorrents } from "./ranker/sort.ts";

import type { RankedResult } from "./types.ts";

export class RTN {
  #settings: Settings;
  #rankingModel: RankingModel;
  #enabledResolutions: Set<string>;

  constructor(
    settings: Settings,
    rankingModel: RankingModel = DEFAULT_RANKING,
  ) {
    this.#settings = settings;
    this.#rankingModel = rankingModel;
    this.#enabledResolutions = new Set(
      Object.entries(settings.resolutions)
        .filter(([_, enabled]) => enabled)
        .map(([res]) => res.replace(/^r/, "")),
    );
  }

  rankTorrent(rawTitle: string, hash: string): RankedResult {
    const data = parse(rawTitle);
    const score = rank(data, this.#settings, this.#rankingModel);
    const fetchResult = checkFetch(data, this.#settings);

    return {
      data,
      hash,
      rank: score,
      fetch: fetchResult.fetch,
      failedChecks: fetchResult.failedChecks,
    };
  }

  rankTorrents(
    torrents: Record<string, string>,
    bucketLimit = Infinity,
  ): Map<string, RankedResult> {
    const rawMap = new Map(
      Object.entries(torrents).map(([hash, title]) => [
        hash,
        this.rankTorrent(title, hash),
      ]),
    );

    return sortTorrents(rawMap, bucketLimit, this.#enabledResolutions);
  }
}
