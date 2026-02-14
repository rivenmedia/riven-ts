import type { ParsedData } from "./schemas.ts";

export interface FetchResult {
  fetch: boolean;
  failedChecks: Set<string>;
}

export interface RankResult {
  totalScore: number;
  scoreParts: Record<string, number>;
}

export interface RankedResult {
  data: ParsedData;
  hash: string;
  rank: number;
  fetch: boolean;
  failedChecks: Set<string>;
  scoreParts: Record<string, number>;
  levRatio: number;
}
