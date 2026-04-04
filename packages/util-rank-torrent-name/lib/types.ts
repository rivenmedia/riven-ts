import { type } from "arktype";

import { ParsedData } from "./schemas.ts";

export const FetchResult = type({
  fetch: "boolean",
  failedChecks: type("Set").as<Set<string>>(),
});

export type FetchResult = typeof FetchResult.infer;

export const RankResult = type({
  totalScore: "number.integer",
  scoreParts: "Record<string > 0, number.integer>",
});

export type RankResult = typeof RankResult.infer;

export const RankedResult = type({
  data: ParsedData,
  hash: "string.hex == 40",
  rank: "number.integer",
  fetch: "boolean",
  failedChecks: type("Set").as<Set<string>>(),
  scoreParts: "Record<string > 0, number.integer>",
  levRatio: "0 <= number <= 1",
});

export type RankedResult = typeof RankedResult.infer;
