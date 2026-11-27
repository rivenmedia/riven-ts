import { emptyJobCounts } from "../_utilities/job-counts.ts";

import type { JobCounts, QueueSummary } from "../_types/job-queue.ts";

/** Counts in the order waiting, prioritized, waiting-children, active, delayed, failed, completed, paused. */
type CountTuple = readonly [
  waiting: number,
  prioritized: number,
  waitingChildren: number,
  active: number,
  delayed: number,
  failed: number,
  completed: number,
  paused: number,
];

const counts = ([
  waiting,
  prioritized,
  waitingChildren,
  active,
  delayed,
  failed,
  completed,
  paused,
]: CountTuple): JobCounts => ({
  ...emptyJobCounts(),
  waiting,
  prioritized,
  "waiting-children": waitingChildren,
  active,
  delayed,
  failed,
  completed,
  paused,
});

const flow = (
  name: string,
  tuple: CountTuple,
  isPaused = false,
): QueueSummary => ({
  kind: "flow",
  name,
  isPaused,
  counts: counts(tuple),
});

const sandboxed = (name: string, tuple: CountTuple): QueueSummary => ({
  kind: "sandboxed",
  name,
  isPaused: false,
  counts: counts(tuple),
});

const plugin = (
  id: string,
  displayName: string,
  event: string,
  tuple: CountTuple,
): QueueSummary => ({
  kind: "plugin",
  name: `riven.${event}.plugin[${id}]`,
  isPaused: false,
  counts: counts(tuple),
  plugin: { id, displayName },
});

/**
 * Every queue Riven declares, in display order. The plugin queues come from
 * each plugin's `config.hooks` keys.
 */
export const queueSummaries: readonly QueueSummary[] = [
  flow("process-item-request", [3, 0, 2, 1, 0, 1, 1284, 0]),
  flow("request-content-services", [0, 0, 0, 0, 6, 0, 392, 0]),
  flow("process-media-item", [31, 0, 14, 2, 0, 7, 4512, 0]),
  flow("scrape-item", [58, 4, 0, 3, 12, 9, 6930, 0]),
  flow("download-item", [9, 0, 5, 2, 3, 4, 3721, 0]),
  flow("download-item.find-valid-torrent", [4, 0, 0, 2, 0, 3, 3698, 0]),
  flow("download-item.rank-streams", [2, 0, 0, 1, 0, 2, 3702, 0]),
  flow("request-stream-link", [0, 0, 0, 1, 0, 1, 2910, 0]),
  flow("request-subtitles", [0, 0, 0, 0, 0, 2, 1876, 17], true),
  flow("post-process-media-item", [5, 0, 0, 1, 0, 0, 3640, 0]),

  sandboxed("map-items-to-files", [0, 0, 0, 1, 0, 2, 3655, 0]),
  sandboxed("parse-scrape-results", [6, 0, 0, 2, 0, 1, 6811, 0]),
  sandboxed("validate-torrent-files", [0, 0, 0, 0, 0, 3, 3402, 0]),

  plugin(
    "torrentio",
    "Torrentio",
    "media-item.scrape.requested",
    [21, 0, 0, 2, 4, 5, 3188, 0],
  ),
  plugin(
    "comet",
    "Comet",
    "media-item.scrape.requested",
    [17, 0, 0, 1, 3, 2, 3140, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.download.requested",
    [2, 0, 0, 1, 0, 3, 3590, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.download.cache-check-requested",
    [0, 0, 0, 0, 0, 0, 7802, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.download.provider-list-requested",
    [0, 0, 0, 0, 0, 0, 412, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.scrape.requested",
    [8, 0, 0, 1, 2, 1, 2975, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.stream-link.requested",
    [0, 0, 0, 1, 0, 1, 2894, 0],
  ),
  plugin(
    "stremthru",
    "StremThru",
    "media-item.stream-link.health-check.requested",
    [0, 0, 0, 0, 5, 0, 1530, 0],
  ),
  plugin(
    "tmdb",
    "TMDB",
    "media-item.index.requested.movie",
    [1, 0, 0, 0, 0, 0, 1912, 0],
  ),
  plugin(
    "tvdb",
    "TVDB",
    "media-item.index.requested.show",
    [2, 0, 0, 1, 0, 1, 2208, 0],
  ),
  plugin(
    "seerr",
    "Seerr",
    "content-service.requested",
    [0, 0, 0, 0, 0, 0, 391, 0],
  ),
  plugin(
    "listrr",
    "Listrr",
    "content-service.requested",
    [0, 0, 0, 0, 0, 0, 388, 0],
  ),
  plugin(
    "mdblist",
    "MDBList",
    "content-service.requested",
    [0, 0, 0, 0, 0, 1, 385, 0],
  ),
  plugin(
    "plex",
    "Plex",
    "content-service.requested",
    [0, 0, 0, 0, 0, 0, 390, 0],
  ),
  plugin(
    "plex",
    "Plex",
    "media-item.download.success",
    [0, 0, 0, 0, 0, 2, 3611, 0],
  ),
  plugin(
    "jellyfin",
    "Jellyfin",
    "media-item.download.success",
    [0, 0, 0, 0, 0, 0, 3611, 0],
  ),
  plugin(
    "silo",
    "Silo",
    "media-item.download.success",
    [0, 0, 0, 0, 1, 0, 3598, 0],
  ),
  plugin(
    "notifications",
    "Notifications",
    "media-item.download.success",
    [0, 0, 0, 0, 0, 4, 3607, 0],
  ),
  plugin(
    "subdl",
    "SubDL",
    "media-item.subtitle.requested",
    [0, 0, 0, 0, 7, 2, 1841, 0],
  ),
];
