import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { Job, UnrecoverableError } from "bullmq";
import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import * as settingsModule from "../../../utilities/settings.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { scrapeItemProcessor } from "./scrape-item.processor.ts";

import type { ScrapeItemFlow } from "./scrape-item.schema.ts";

it.beforeEach(({ redisUrl }) => {
  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    redisUrl,
  });
});

it("throws an unrecoverable error if the item cannot be scraped", async () => {
  const sendEvent = vi.fn();

  const mockQueue = createQueue("mock-queue");
  const job = await Job.create<
    ScrapeItemFlow["input"],
    ScrapeItemFlow["output"]
  >(mockQueue, "mock-scrape-item", {
    id: 1,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() => scrapeItemProcessor(job, sendEvent)).rejects.toThrow(
    UnrecoverableError,
  );
});

it('sends a "riven.media-item.scrape.success" event with the updated item if the scrape is successful', async () => {
  const sendEvent = vi.fn();

  vi.spyOn(Settings, "now").mockReturnValue(10000);

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<ScrapeItemFlow["processor"]>[0] = await Job.create(
    mockQueue,
    "mock-scrape-item",
    {
      id: 1,
    },
  );

  const em = database.orm.em.fork();

  em.create(Movie, {
    id: 1,
    tmdbId: "123",
    contentRating: "g",
    state: "indexed",
    title: "Test Movie",
    year: 2024,
  });

  await em.flush();

  const streamInfoHash = "test-info-hash";

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      success: true,
      result: {
        id: 1,
        results: {
          [streamInfoHash]: {
            title: "Test Movie 2024 1080p",
          },
        },
      },
    },
  });

  await scrapeItemProcessor(job, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.scrape.success",
    item: expect.any(Movie) as Movie,
  });
});

it.todo("scraped individual seasons if no results were found for a show");

it.todo(
  "scrapes individual episodes if no results were found for a season of a show",
);
