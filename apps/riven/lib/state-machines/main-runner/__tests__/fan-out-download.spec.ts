import { getEventTypeFromSchema } from "@rivenmedia/plugin-sdk";
import { MediaItemDownloadErrorEvent } from "@rivenmedia/plugin-sdk/schemas/events/media-item.download.error.event";

import assert from "node:assert";
import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

const eventType = getEventTypeFromSchema(MediaItemDownloadErrorEvent);

it(`enqueues a scrape for each incomplete season when a "${eventType}" event is received for a show`, async ({
  actor,
  scrapedShowContext: { scrapedShow },
}) => {
  const seasons = await scrapedShow.seasons.load();

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  await waitFor(actor, (state) => state.matches("Running"));

  actor.send({
    type: "riven.media-item.download.error",
    item: scrapedShow,
    error: "No valid torrents found",
  });

  await vi.waitFor(() => {
    for (const season of seasons) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "scrape-item",
            data: expect.objectContaining({
              id: season.id,
            }),
          }),
        ]),
      );
    }
  });
});

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
    type: "riven.media-item.download.error",
    item: failedSeason,
    error: "No valid torrents found",
  });

  await vi.waitFor(() => {
    for (const episode of failedSeason.episodes) {
      expect(flowAddBulkSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            queueName: "scrape-item",
            data: expect.objectContaining({
              id: episode.id,
            }),
          }),
        ]),
      );
    }
  });
});
