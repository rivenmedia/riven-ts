import { RTN } from "@repo/util-rank-torrent-name";

import { settings } from "../utilities/settings.ts";
import { loadRankingConfig } from "./load-ranking-config.ts";

export const rankingConfig = await loadRankingConfig(
  settings.rankingConfigPath,
);

export const rtnInstance = new RTN(
  rankingConfig.rankingModel,
  rankingConfig.settings,
);
