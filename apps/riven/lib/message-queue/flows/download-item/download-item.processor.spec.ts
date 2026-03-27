import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import * as Sentry from "@sentry/node";
import { UnrecoverableError } from "bullmq";
import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { rivenTestContext as it } from "../../../__tests__/test-context.ts";
import { downloadItemProcessor } from "./download-item.processor.ts";

it("throws an unrecoverable error if no valid torrent is found", async ({
  createMockJob,
  seeders: { seedScrapedMovie },
}) => {
  const movie = await seedScrapedMovie();

  const job = await createMockJob({ id: movie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() =>
    downloadItemProcessor({ job, scope: new Sentry.Scope() }, vi.fn()),
  ).rejects.toThrow(UnrecoverableError);
});

it('sends a "riven.media-item.download.success" event with the updated item and duration from request to download if the download result is valid', async ({
  scrapedMovie,
  createMockJob,
}) => {
  vi.spyOn(Settings, "now").mockReturnValue(10000);

  const streams = await scrapedMovie.streams.load();
  const streamInfoHash = streams[0]?.infoHash;

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

  await downloadItemProcessor({ job, scope: new Sentry.Scope() }, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.success",
    item: expect.any(Movie),
    durationFromRequestToDownload: 9,
    downloader: "@repo/plugin-test",
    provider: null,
  });
});

it('sends a "riven.media-item.download.partial-success" event with the updated item if the download result is valid but does not contain all episodes', async ({
  createMockJob,
  scrapedShow,
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

  await downloadItemProcessor({ job, scope: new Sentry.Scope() }, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.partial-success",
    item: expect.any(Show),
    downloader: "@repo/plugin-test",
  });
});

it('sends a "riven.media-item.download.error" event if no valid torrent is found', async ({
  createMockJob,
  scrapedMovie,
}) => {
  const job = await createMockJob({ id: scrapedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  const sendEvent = vi.fn();

  await downloadItemProcessor(
    {
      job,
      scope: new Sentry.Scope(),
    },
    sendEvent,
  ).catch(() => {
    /* empty */
  });

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.error",
    item: expect.any(Movie),
    error: expect.any(UnrecoverableError),
  });
});
