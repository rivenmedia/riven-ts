import { settings } from "../utilities/settings.ts";
import { loadRankingConfig } from "./load-ranking-config.ts";

export const { rankingModel: rtnRankingModel, settings: rtnRankingSettings } =
  loadRankingConfig(settings.rankingConfigPath);
