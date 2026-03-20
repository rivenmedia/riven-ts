import {
  Episode,
  ItemRequest,
  Movie,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";
import { it } from "@repo/util-plugin-testing/plugin-test-context";
import { parse } from "@repo/util-rank-torrent-name";

import { Job, UnrecoverableError } from "bullmq";
import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { database } from "../../../database/database.ts";
import { createQueue } from "../../utilities/create-queue.ts";
import { downloadItemProcessor } from "./download-item.processor.ts";

import type { DownloadItemFlow } from "./download-item.schema.ts";

it("throws an unrecoverable error if no valid torrent is found", async () => {
  const sendEvent = vi.fn();

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "movie",
  });

  em.create(Movie, {
    id: 1,
    contentRating: "g",
    tmdbId: "1234",
    title: "Test Movie",
    year: 2024,
    itemRequest,
    isRequested: true,
    fullTitle: "Test Movie",
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
    await Job.create(
      mockQueue,
      "mock-download-item",
      { id: 1 },
      { timestamp: 1000 },
    );

  const em = database.orm.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "movie",
  });

  const movie = em.create(Movie, {
    id: 1,
    tmdbId: "123",
    contentRating: "g",
    title: "Test Movie",
    year: 2024,
    itemRequest,
    isRequested: true,
    fullTitle: "Test Movie",
  });

  const streamInfoHash = "test-info-hash";

  const stream = em.create(Stream, {
    infoHash: streamInfoHash,
    parsedData: parse("Test Movie 2024 1080p"),
  });

  movie.streams.add(stream);

  await em.flush();

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

  await downloadItemProcessor({ job }, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.success",
    item: expect.any(Movie) as Movie,
    durationFromRequestToDownload: 9,
    downloader: "@repo/plugin-test",
    provider: null,
  });
});

it('sends a "riven.media-item.download.partial-success" event with the updated item if the download result is valid but does not contain all episodes', async () => {
  const sendEvent = vi.fn();

  const em = database.orm.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const show = em.create(Show, {
    tvdbId: "123",
    contentRating: "tv-14",
    title: "Test Show",
    year: 2024,
    itemRequest,
    status: "continuing",
    isRequested: true,
    fullTitle: "Test Show",
    keepUpdated: false,
  });

  await em.flush();

  for (let i = 1; i <= 2; i++) {
    const season = em.create(Season, {
      number: i,
      title: `Season ${i.toString()}`,
      isSpecial: false,
      isRequested: true,
      fullTitle: `${show.fullTitle} - S${i.toString().padStart(2, "0")}`,
      itemRequest,
    });

    show.seasons.add(season);

    await em.flush();

    for (let j = 1; j <= 2; j++) {
      const episode = em.create(Episode, {
        title: `Test Show S01E0${j.toString()}`,
        contentRating: "tv-14",
        year: 2024,
        number: j,
        absoluteNumber: j,
        isSpecial: season.isSpecial,
        isRequested: true,
        fullTitle: `${season.fullTitle} - E${j.toString().padStart(2, "0")}`,
        itemRequest,
      });

      season.episodes.add(episode);
    }
  }

  const streamInfoHash = "test-info-hash";

  const stream = em.create(Stream, {
    infoHash: streamInfoHash,
    parsedData: parse("Test Show 2024 1080p"),
  });

  show.streams.add(stream);

  await em.flush();

  const episodes = await show.getEpisodes();

  expect.assert(episodes[0]);
  expect.assert(episodes[1]);

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

  await downloadItemProcessor({ job }, sendEvent);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.partial-success",
    item: expect.any(Show) as Show,
    downloader: "@repo/plugin-test",
  });
});

it('sends a "riven.media-item.download.error" event if no valid torrent is found', async () => {
  const sendEvent = vi.fn();

  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "movie",
  });

  em.create(Movie, {
    id: 1,
    contentRating: "g",
    tmdbId: "1234",
    title: "Test Movie",
    year: 2024,
    itemRequest,
    isRequested: true,
    fullTitle: "Test Movie",
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
    error: "No valid torrent found",
  });
});
