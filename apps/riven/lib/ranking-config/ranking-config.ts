import { settings } from "../utilities/settings.ts";
import { loadRankingConfig } from "./load-ranking-config.ts";

export const { rankingModel: rtnRankingModel, settings: rtnSettings } =
  await loadRankingConfig(settings.rankingConfigPath);
