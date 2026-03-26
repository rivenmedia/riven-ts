import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import * as Sentry from "@sentry/node";
import { Job, UnrecoverableError } from "bullmq";
import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { MovieSeeder } from "../../../database/seeders/movies/movie.seeder.ts";
import { ScrapedMovieSeeder } from "../../../database/seeders/movies/scraped-movie.seeder.ts";
import { ScrapedShowSeeder } from "../../../database/seeders/shows/scraped-show.seeder.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { downloadItemProcessor } from "./download-item.processor.ts";

import type { DownloadItemFlow } from "./download-item.schema.ts";

it("throws an unrecoverable error if no valid torrent is found", async () => {
  await database.orm.seeder.seed(MovieSeeder);

  const movie = await database.movie.findOneOrFail({ type: "movie" });

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: movie.id,
    });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  const sendEvent = vi.fn();

  await expect(() =>
    downloadItemProcessor({ job, scope: new Sentry.Scope() }, sendEvent),
  ).rejects.toThrow(UnrecoverableError);
});

it('sends a "riven.media-item.download.success" event with the updated item and duration from request to download if the download result is valid', async () => {
  vi.spyOn(Settings, "now").mockReturnValue(10000);

  await database.orm.seeder.seed(ScrapedMovieSeeder);

  const movie = await database.movie.findOneOrFail({ type: "movie" });
  const streams = await movie.streams.load();
  const streamInfoHash = streams[0]?.infoHash;

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(
      mockQueue,
      "mock-download-item",
      { id: movie.id },
      { timestamp: 1000 },
    );

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
            matchedMediaItemId: movie.id,
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

it('sends a "riven.media-item.download.partial-success" event with the updated item if the download result is valid but does not contain all episodes', async () => {
  await database.orm.seeder.seed(ScrapedShowSeeder);

  const show = await database.show.findOneOrFail({
    type: "show",
  });

  const episodes = await show.getEpisodes();

  expect.assert(episodes[0]);
  expect.assert(episodes[1]);

  await show.streams.load();

  const streamInfoHash = show.streams[0]?.infoHash;

  expect.assert(streamInfoHash);

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: show.id,
    });

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

it('sends a "riven.media-item.download.error" event if no valid torrent is found', async () => {
  await database.orm.seeder.seed(MovieSeeder);

  const movie = await database.movie.findOneOrFail({ type: "movie" });

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: movie.id,
    });

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
