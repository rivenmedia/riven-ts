import {
  type RankingModel,
  RankingModelSchema,
} from "@repo/util-rank-torrent-name";

import type { RawRankingConfig } from "./ranking-config.schema.ts";
import type { PartialDeep } from "type-fest";

const manualScrapeRankingModel = Object.fromEntries(
  Object.keys(RankingModelSchema.shape).map((key) => [key, 0]),
) as RankingModel;

/**
 * RTN configuration used for manual scraping.
 *
 * All ranking weights are set to 0 (meaning everything will be fetched and ranked equally), and all resolutions are enabled.
 */
export const manualScrapeConfig = {
  rankingModel: manualScrapeRankingModel,
  settings: {
    options: {
      removeAllTrash: false,
      removeAdultContent: false,
    },
    resolutions: {
      r2160p: true,
      r1080p: true,
      r720p: true,
      r480p: true,
      r360p: true,
    },
  },
} satisfies PartialDeep<RawRankingConfig>;
