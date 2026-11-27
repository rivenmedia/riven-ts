import { expect, it } from "vitest";

import { getQueueDisplayName } from "./queue-display-name.ts";

it.for([
  ["scrape-item", "Scrape item"],
  ["download-item.find-valid-torrent", "Find valid torrent"],
  ["post-process-media-item", "Post process media item"],
  ["riven.media-item.scrape.requested.plugin[torrentio]", "Scrape requested"],
  [
    "riven.media-item.download.cache-check-requested.plugin[stremthru]",
    "Download cache check requested",
  ],
  [
    "riven.media-item.index.requested.movie.plugin[tmdb]",
    "Index requested movie",
  ],
  [
    "riven.content-service.requested.plugin[seerr]",
    "Content service requested",
  ],
  ["riven-external.item-requested.plugin[seerr]", "Item requested"],
] as const)("names the %s queue %j", ([queueName, expected]) => {
  expect(getQueueDisplayName(queueName)).toBe(expected);
});
