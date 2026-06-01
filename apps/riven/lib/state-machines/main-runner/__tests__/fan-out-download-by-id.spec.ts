import { getEventTypeFromSchema } from "@repo/util-plugin-sdk";
import { MediaItemNzbScrapeErrorEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.nzb-scrape.error.event";

import assert from "node:assert";
import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

const eventType = getEventTypeFromSchema(MediaItemNzbScrapeErrorEvent);

// The NZB lifecycle events carry only `itemId` (not the MediaItem entity that
// the torrent-side fan-out uses), so the fan-out must load the item by id.

it(`enqueues a scrape for each incomplete episode when a "${eventType}" event is received for a season`, async ({
  actor,
  scrapedShowContext: { scrapedShow },
}) => {
  const [, , failedSeason] = await scrapedShow.seasons.load();
  assert(failedSeason);

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.nzb-scrape.error",
    itemId: failedSeason.id,
    reason: "no-new-streams",
  });

  await vi.waitFor(() => {
    for (const episode of failedSeason.episodes) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({ id: episode.id }),
              isRootItem: false,
            }),
          }),
        ]),
      );
    }
  });
});

it(`enqueues a scrape for each incomplete season when a "${eventType}" event is received for a show`, async ({
  actor,
  scrapedShowContext: { scrapedShow },
}) => {
  const seasons = await scrapedShow.seasons.load();

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();
  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.nzb-scrape.error",
    itemId: scrapedShow.id,
    reason: "no-new-streams",
  });

  await vi.waitFor(() => {
    for (const season of seasons) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "process-media-item",
            data: expect.objectContaining({
              mediaItem: expect.objectContaining({ id: season.id }),
              isRootItem: false,
            }),
          }),
        ]),
      );
    }
  });
});

// Leaf items (Movie/Episode) are a safe no-op: getFanOutDownloadItems returns
// [] for them (asserted directly below), so the by-id fan-out enqueues nothing.
it("getFanOutDownloadItems returns [] for a leaf movie (no fan-out)", async ({
  indexedMovieContext: { indexedMovie },
  services: { downloaderService },
}) => {
  const items = await downloaderService.getFanOutDownloadItems(indexedMovie.id);

  expect(items).toEqual([]);
});
