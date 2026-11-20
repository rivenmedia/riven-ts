import { expect, vi } from "vitest";
import { waitFor } from "xstate";

import { flow } from "#message-queue/flows/producer.ts";

import { it } from "./helpers/test-context.ts";

import type { MainRunnerMachineEvent } from "#state-machines/main-runner/index.ts";
import type { Show } from "@repo/util-plugin-sdk/dto/entities";

it.for<{ type: string; createEvent: (item: Show) => MainRunnerMachineEvent }>([
  {
    type: "riven.media-item.download.partial-success",
    createEvent: (item) => ({
      type: "riven.media-item.download.partial-success",
      item,
      downloader: "@repo/plugin-test",
    }),
  },
  {
    type: "riven.media-item.scrape.error.no-streams-found",
    createEvent: (item) => ({
      type: "riven.media-item.scrape.error.no-streams-found",
      item,
      error: "No streams found",
    }),
  },
])(
  'enqueues each incomplete season of a show after a "$type" event',
  async ({ createEvent }, { actor, scrapedShowContext: { scrapedShow } }) => {
    const seasons = await scrapedShow.seasons.load();
    const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

    actor.start();

    await waitFor(actor, (state) => state.matches("Running"));

    actor.send(createEvent(scrapedShow));

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
  },
);
