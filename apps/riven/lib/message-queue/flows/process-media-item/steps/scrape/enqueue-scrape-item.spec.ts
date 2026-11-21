import { expect, vi } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { flow } from "#message-queue/flows/producer.ts";

import { enqueueScrapeItem } from "./enqueue-scrape-item.ts";

import type { FlowJob } from "bullmq";

const parent = { id: "parent-id", queue: "bull:process-media-item" };

it("creates a scrape job that parses the results of a scrape job for each scraper plugin", async ({
  mockFlowProcessorContext: { plugins },
  overrideRuntimeSettings,
  indexedMovieContext: { indexedMovie },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { maximumFailedAttempts: 5 } },
  });

  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  indexedMovie.failedScrapeAttempts = 2;

  await enqueueScrapeItem({
    item: indexedMovie,
    subscribers: plugins
      .values()
      .map(({ config }) => config)
      .toArray(),
    parent,
    isRootItem: true,
  });

  const [[node] = []] = addSpy.mock.calls as [FlowJob][];

  expect(node).toMatchObject({
    name: `Scraping ${indexedMovie.fullTitle}`,
    queueName: "scrape-item",
    data: { id: indexedMovie.id },
    opts: {
      parent,
      continueParentOnFailure: true,
      attempts: 3,
      backoff: { type: "custom" },
    },
    children: [
      {
        queueName: "scrape-item.parse-scrape-results",
        data: { id: indexedMovie.id, title: indexedMovie.fullTitle },
        opts: { ignoreDependencyOnFailure: true },
        children: [
          {
            name: `@repo/plugin-test - Scrape ${indexedMovie.fullTitle}`,
            queueName:
              "riven.media-item.scrape.requested.plugin[@repo/plugin-test]",
            data: { item: indexedMovie.id },
            opts: { ignoreDependencyOnFailure: true },
          },
        ],
      },
    ],
  });
});

it("attempts to scrape a child item once", async ({
  indexedMovieContext: { indexedMovie },
}) => {
  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  await enqueueScrapeItem({
    item: indexedMovie,
    subscribers: [],
    parent,
    isRootItem: false,
  });

  expect(addSpy).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      opts: expect.objectContaining({ attempts: 1 }),
    }),
  );
});

it("does not scrape a root item that has no scrape attempts left", async ({
  overrideRuntimeSettings,
  indexedMovieContext: { indexedMovie },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { maximumFailedAttempts: 5 } },
  });

  const addSpy = vi.spyOn(flow, "add").mockResolvedValue({} as never);

  indexedMovie.failedScrapeAttempts = 5;

  await expect(
    enqueueScrapeItem({
      item: indexedMovie,
      subscribers: [],
      parent,
      isRootItem: true,
    }),
  ).resolves.toBeNull();
  expect(addSpy).not.toHaveBeenCalled();
});
