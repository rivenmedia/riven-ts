import { RTN } from "@repo/util-rank-torrent-name";

import { instanceSettings } from "../utilities/instance-settings.ts";
import { loadRankingConfig } from "./load-ranking-config.ts";

export const rankingConfig = await loadRankingConfig(
  instanceSettings.instanceSettings.rankingConfigPath,
);

export const rtnInstance = new RTN(
  rankingConfig.settings,
  rankingConfig.rankingModel,
);
