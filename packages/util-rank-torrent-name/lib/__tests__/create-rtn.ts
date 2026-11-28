import { createRankingModel } from "../ranker/ranking-settings.schema.ts";
import { RTN } from "../rtn.ts";

import type { SettingsInput } from "../ranker/ranking-settings.schema.ts";

export const HASH = "a".repeat(40);

export const RELEASE = "The Matrix 1999 1080p BluRay x264";

export const createRtn = (settings: SettingsInput = {}) =>
  new RTN(createRankingModel({ bluray: 100, avc: 50 }), settings);
