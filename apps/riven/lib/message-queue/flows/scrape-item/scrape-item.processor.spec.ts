import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name";

import { faker } from "@faker-js/faker";
import * as Sentry from "@sentry/node";
import { Job } from "bullmq";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../../__tests__/test-context.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { scrapeItemProcessor } from "./scrape-item.processor.ts";

import type { ScrapeItemFlow } from "./scrape-item.schema.ts";

it("throws an unrecoverable error if the item cannot be scraped", async () => {
  const sendEvent = vi.fn();

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<ScrapeItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-scrape-item", { id: 1 });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() =>
    scrapeItemProcessor({ job, scope: new Sentry.Scope() }, sendEvent),
  ).rejects.toThrow();
});

it.todo("throws an unrecoverable if no new streams were found");

it('sends a "riven.media-item.scrape.success" event with the updated item if the scrape is successful', async ({
  seeders: { seedMovie },
}) => {
  await seedMovie();

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<ScrapeItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-scrape-item", { id: 1 });

  const streamInfoHash = faker.git.commitSha();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: 1,
      results: {
        [streamInfoHash]: parse("Test Movie 2024 1080p WEB-DL"),
      },
    },
  });

  const sendEvent = vi.fn();

  await scrapeItemProcessor(
    {
      job,
      scope: new Sentry.Scope(),
    },
    sendEvent,
  );

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.scrape.success",
    item: expect.any(Movie),
  });
});

it.todo("scrapes individual seasons if no results were found for a show");

it.todo(
  "scrapes individual episodes if no results were found for a season of a show",
);
