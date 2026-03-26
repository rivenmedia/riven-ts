import { getEventTypeFromSchema } from "@repo/util-plugin-sdk";
import { Show } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemDownloadErrorEvent } from "@repo/util-plugin-sdk/schemas/events/media-item.download.error.event";

import assert from "node:assert";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { ScrapedShowSeeder } from "../../../database/seeders/shows/scraped-show.seeder.ts";
import { flow } from "../../../message-queue/flows/producer.ts";
import { it } from "./helpers/test-context.ts";

const eventType = getEventTypeFromSchema(MediaItemDownloadErrorEvent);

it(`enqueues a scrape for each incomplete season when a "${eventType}" event is received for a show`, async ({
  actor,
}) => {
  await database.orm.seeder.seed(ScrapedShowSeeder);

  const show = await database.em
    .fork()
    .findOneOrFail(Show, { type: "show" }, { populate: ["seasons"] });

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  actor.send({
    type: "riven.media-item.download.error",
    item: show,
    error: "No valid torrents found",
  });

  await vi.waitFor(() => {
    for (const season of show.seasons) {
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
}) => {
  await database.orm.seeder.seed(ScrapedShowSeeder);

  const show = await database.em
    .fork()
    .findOneOrFail(
      Show,
      { type: "show" },
      { populate: ["seasons", "seasons.episodes"] },
    );

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk");

  actor.start();

  const failedSeason = show.seasons[2];

  assert(failedSeason);

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
