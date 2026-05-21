import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { loadRankingConfig } from "./load-ranking-config.ts";

export const rankingConfig = loadRankingConfig(
  settings.rankingConfigPath,
  (message) => logger.warn(message),
);

export const rtnSettings = rankingConfig.settings;
export const rtnRankingModel = rankingConfig.rankingModel;
