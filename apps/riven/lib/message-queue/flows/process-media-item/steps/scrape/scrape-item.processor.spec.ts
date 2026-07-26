import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { parse } from "@repo/util-rank-torrent-name/parser";

import { faker } from "@faker-js/faker";
import { UnrecoverableError } from "bullmq";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { scrapeItemProcessor } from "./scrape-item.processor.ts";

import type { MainRunnerMachineIntake } from "../../../../../state-machines/main-runner/index.ts";

it("throws an UnrecoverableError if the item cannot be scraped", async ({
  createMockJob,
  mockSentryScope,
  services,
}) => {
  const job = await createMockJob({ id: randomUUID() });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(async () =>
    scrapeItemProcessor(
      {
        job,
        scope: mockSentryScope,
      },
      {
        sendEvent: vi.fn<MainRunnerMachineIntake>(),
        services,
        plugins: new Map(),
      },
    ),
  ).rejects.toThrow(UnrecoverableError);
});

it.todo("throws an unrecoverable if no new streams were found");

it('sends a "riven.media-item.scrape.success" event with the updated item if the scrape is successful', async ({
  seeders: { seedIndexedMovie },
  createMockJob,
  mockSentryScope,
  services,
  createMockJobChildKey,
}) => {
  const indexedMovie = await seedIndexedMovie();

  const job = await createMockJob({ id: indexedMovie.movie.id });

  const streamInfoHash = faker.git.commitSha();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("scrape-item.parse-scrape-results")]: {
      id: indexedMovie.movie.id,
      results: {
        [streamInfoHash]: parse("Test Movie 2024 1080p WEB-DL"),
      },
    },
  });

  const sendEvent = vi.fn<MainRunnerMachineIntake>();

  await scrapeItemProcessor(
    {
      job,
      scope: mockSentryScope,
    },
    {
      sendEvent,
      services,
      plugins: new Map(),
    },
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
