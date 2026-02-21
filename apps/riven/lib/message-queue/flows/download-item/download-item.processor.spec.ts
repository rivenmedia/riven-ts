import { Movie, Stream } from "@repo/util-plugin-sdk/dto/entities";
import { it } from "@repo/util-plugin-testing/plugin-test-context";

import { Job, UnrecoverableError } from "bullmq";
import { DateTime, Settings } from "luxon";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import * as settingsModule from "../../../utilities/settings.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { downloadItemProcessor } from "./download-item.processor.ts";

import type { DownloadItemFlow } from "./download-item.schema.ts";

it.beforeEach(({ redisUrl }) => {
  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    redisUrl,
  });
});

it("throws an unrecoverable error if no valid torrent container is found", async () => {
  const sendEvent = vi.fn();

  const em = database.em.fork();

  em.create(Movie, {
    id: 1,
    contentRating: "g",
    tmdbId: "1234",
    state: "scraped",
    title: "Test Movie",
    year: 2024,
  });

  await em.flush();

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: 1,
    });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() => downloadItemProcessor({ job }, sendEvent)).rejects.toThrow(
    UnrecoverableError,
  );
});

it('sends a "riven.media-item.download.success" event with the updated item and duration from request to download if the download result is valid', async () => {
  const sendEvent = vi.fn();

  vi.spyOn(Settings, "now").mockReturnValue(10000);

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: 1,
    });

  const expectedDuration = 1;

  const em = database.orm.em.fork();

  const movie = em.create(Movie, {
    id: 1,
    tmdbId: "123",
    contentRating: "g",
    state: "scraped",
    title: "Test Movie",
    year: 2024,
    createdAt: DateTime.now().minus({ seconds: expectedDuration }).toJSDate(),
  });

  const streamInfoHash = "test-info-hash";

  const stream = em.create(Stream, {
    infoHash: streamInfoHash,
    parsedTitle: "Test Movie 2024 1080p",
    rank: 1,
    rawTitle: "Test Movie 2024 1080p",
  });

  movie.streams.add(stream);

  await em.flush();

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "find-valid-torrent-container": {
      result: {
        files: [
          {
            fileName: "Test Movie 2024 1080p.mkv",
            fileSize: 1024,
          },
        ],
        infoHash: streamInfoHash,
        torrentId: "",
        torrentInfo: {
          files: {},
          infoHash: "",
          name: "",
          id: "",
          isCached: true,
          links: [],
          sizeMB: 0,
          alternativeFilename: "",
        },
      },
      plugin: "@repo/plugin-test",
    },
  });

  await downloadItemProcessor({ job }, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.success",
    item: expect.any(Movie) as Movie,
    durationFromRequestToDownload: expectedDuration,
  });
});

it('sends a "riven.media-item.download.error" event if no valid torrent container is found', async () => {
  const sendEvent = vi.fn();

  const em = database.em.fork();

  em.create(Movie, {
    id: 1,
    contentRating: "g",
    tmdbId: "1234",
    state: "scraped",
    title: "Test Movie",
    year: 2024,
  });

  await em.flush();

  const mockQueue = createQueue("mock-queue");
  const job: Parameters<DownloadItemFlow["processor"]>[0]["job"] =
    await Job.create(mockQueue, "mock-download-item", {
      id: 1,
    });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await downloadItemProcessor({ job }, sendEvent).catch(() => {
    /* empty */
  });

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.error",
    item: expect.any(Movie) as Movie,
    error: "No valid torrent container found",
  });
});
