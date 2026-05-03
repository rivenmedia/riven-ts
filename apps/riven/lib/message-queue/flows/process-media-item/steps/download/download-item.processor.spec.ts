import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../../../__tests__/test-context.ts";
import { downloadItemProcessor } from "./download-item.processor.ts";

it('sends a "riven.media-item.download.success" event with the updated item and duration from request to download if the download result is valid', async ({
  scrapedMovieContext: { scrapedMovie },
  createMockJob,
  mockSentryScope,
  services,
}) => {
  vi.spyOn(Settings, "now").mockReturnValue(10000);

  const [{ infoHash: streamInfoHash } = {}] = await scrapedMovie.streams.load();

  const job = await createMockJob({ id: scrapedMovie.id }, { timestamp: 1000 });

  expect.assert(streamInfoHash);

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "find-valid-torrent": {
      result: {
        torrentId: "1234",
        infoHash: streamInfoHash,
        provider: null,
        files: [
          {
            name: "Test Movie 2024 1080p.mkv",
            path: "/Test Movie 2024 1080p.mkv",
            size: 1024,
            link: "http://example.com/download",
            matchedMediaItemId: scrapedMovie.id,
            isCachedFile: false,
          },
        ],
      },
      plugin: "@repo/plugin-test",
    },
  });

  const sendEvent = vi.fn();

  await downloadItemProcessor(
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
    type: "riven.media-item.download.success",
    item: expect.any(Movie),
    durationMs: 9000,
    downloader: "@repo/plugin-test",
    provider: null,
  });
});

it('sends a "riven.media-item.download.partial-success" event with the updated item if the download result is valid but does not contain all episodes', async ({
  createMockJob,
  scrapedShowContext: { scrapedShow },
  mockSentryScope,
  services,
}) => {
  const episodes = await scrapedShow.getEpisodes();

  expect.assert(episodes[0]);
  expect.assert(episodes[1]);

  const [{ infoHash: streamInfoHash } = {}] = await scrapedShow.streams.load();

  expect.assert(streamInfoHash);

  const job = await createMockJob({ id: scrapedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "find-valid-torrent": {
      result: {
        torrentId: "1234",
        infoHash: streamInfoHash,
        provider: null,
        files: [
          {
            name: "Test Show S01E01 2024 1080p.mkv",
            path: "/Test Show S01E01 2024 1080p.mkv",
            size: 1024,
            link: "http://example.com/download",
            matchedMediaItemId: episodes[0].id,
            isCachedFile: false,
          },
          {
            name: "Test Show S01E02 2024 1080p.mkv",
            path: "/Test Show S01E02 2024 1080p.mkv",
            size: 1024,
            link: "http://example.com/download",
            matchedMediaItemId: episodes[1].id,
            isCachedFile: false,
          },
        ],
      },
      plugin: "@repo/plugin-test",
    },
  });

  const sendEvent = vi.fn();

  await downloadItemProcessor(
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
    type: "riven.media-item.download.partial-success",
    item: expect.any(Show),
    downloader: "@repo/plugin-test",
  });
});

it('sends a "riven.media-item.download.error" event if no valid torrent is found', async ({
  createMockJob,
  scrapedMovieContext: { scrapedMovie },
  mockSentryScope,
  services,
}) => {
  const job = await createMockJob({ id: scrapedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  const sendEvent = vi.fn();

  await downloadItemProcessor(
    {
      job,
      scope: mockSentryScope,
    },
    {
      sendEvent,
      services,
      plugins: new Map(),
    },
  ).catch(() => {
    /* empty */
  });

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.error",
    item: expect.any(Movie),
    error: expect.any(Error),
  });
});
