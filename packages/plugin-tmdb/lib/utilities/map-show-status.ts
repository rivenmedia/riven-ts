import type { IndexerDataStatus } from "@repo/util-plugin-sdk/dto/enums/indexer-data-status.enum";

const showStatusMap = new Map<string, IndexerDataStatus>([
  ["returning series", "ongoing"],
  ["ended", "released"],
  ["canceled", "released"],
  ["in production", "unreleased"],
  ["planned", "unreleased"],
  ["pilot", "unreleased"],
]);

/**
 * Maps a TMDB TV series status (e.g. "Returning Series") to an {@link IndexerDataStatus}.
 */
export function mapShowStatus(status: string): IndexerDataStatus {
  return showStatusMap.get(status.toLowerCase()) ?? "unknown";
}
