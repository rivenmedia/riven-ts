import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemScrapeError } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.event";
import { MediaItemScrapeErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.incorrect-state.event";
import { MediaItemScrapeErrorNoNewStreams } from "@repo/util-plugin-sdk/schemas/events/media-item.scrape.error.no-new-streams.event";
import { parse } from "@repo/util-rank-torrent-name/parser";

import { faker } from "@faker-js/faker";
import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { scrapeItemProcessor } from "./scrape-item.processor.ts";

it("throws an unrecoverable error if the item cannot be scraped", async ({
  createMockJob,
  mockSentryScope,
  services,
}) => {
  const job = await createMockJob({ id: randomUUID() });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() =>
    scrapeItemProcessor(
      {
        job,
        scope: mockSentryScope,
      },
      {
        sendEvent: vi.fn(),
        services,
        plugins: new Map(),
      },
    ),
  ).rejects.toThrow();
});

it("throws UnrecoverableError when scrape returns MediaItemScrapeErrorIncorrectState", async ({
  seeders: { seedIndexedMovie },
  createMockJob,
  mockSentryScope,
  services,
}) => {
  const { movie } = await seedIndexedMovie();
  const job = await createMockJob({ id: movie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});
  vi.spyOn(services.scraperService, "scrapeItem").mockResolvedValue({
    item: movie,
    error: new MediaItemScrapeErrorIncorrectState({ item: movie }),
  });

  const sendEvent = vi.fn();

  await expect(
    scrapeItemProcessor(
      { job, scope: mockSentryScope },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow();

  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.media-item.scrape.error.incorrect-state",
    }),
  );
});

it("re-throws MediaItemScrapeErrorNoNewStreams without making it unrecoverable", async ({
  seeders: { seedIndexedMovie },
  createMockJob,
  mockSentryScope,
  services,
}) => {
  const { movie } = await seedIndexedMovie();
  const job = await createMockJob({ id: movie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});
  vi.spyOn(services.scraperService, "scrapeItem").mockResolvedValue({
    item: movie,
    error: new MediaItemScrapeErrorNoNewStreams({
      item: movie,
      error: "No new streams",
    }),
  });

  const sendEvent = vi.fn();

  await expect(
    scrapeItemProcessor(
      { job, scope: mockSentryScope },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow(MediaItemScrapeErrorNoNewStreams);

  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.media-item.scrape.error.no-new-streams",
    }),
  );
});

it('sends a "riven.media-item.scrape.success" event with the updated item if the scrape is successful', async ({
  seeders: { seedIndexedMovie },
  createMockJob,
  mockSentryScope,
  services,
}) => {
  const indexedMovie = await seedIndexedMovie();

  const job = await createMockJob({ id: indexedMovie.movie.id });

  const streamInfoHash = faker.git.commitSha();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      id: indexedMovie.movie.id,
      results: {
        [streamInfoHash]: parse("Test Movie 2024 1080p WEB-DL"),
      },
    },
  });

  const sendEvent = vi.fn();

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
