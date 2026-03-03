import {
  ItemRequest,
  type MediaItem,
  Movie,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";
import {
  createSettings,
  defaultRankingModel,
} from "@repo/util-rank-torrent-name";

import { Job, type Queue } from "bullmq";
import { it as baseIt, expect, vi } from "vitest";

import { database } from "../../../../../database/database.ts";
import { createQueue } from "../../../../utilities/create-queue.ts";
import { rankStreamsProcessor } from "./rank-streams.processor.ts";

const it = baseIt.extend<{
  item: MediaItem;
  mockQueue: Queue;
}>({
  mockQueue: createQueue("mock-queue"),
  item: async ({}, use) => {
    const em = database.em.fork();

    const itemRequest = em.create(ItemRequest, {
      requestedBy: "@repo/plugin-test",
      state: "completed",
      type: "movie",
    });

    const item = em.create(Movie, {
      id: 1,
      title: "Test Movie",
      contentRating: "g",
      itemRequest,
      state: "scraped",
      tmdbId: "12345",
    });

    em.create(Stream, {
      infoHash: "1234567890123456789012345678901234567890",
      parsedData: {} as never,
    });

    em.create(Stream, {
      infoHash: "2234567890123456789012345678901234567890",
      parsedData: {} as never,
    });

    em.create(Stream, {
      infoHash: "3234567890123456789012345678901234567890",
      parsedData: {} as never,
    });

    await em.flush();

    await use(item);
  },
});

it("does not include streams that throw GarbageTorrentError", async ({
  item,
  mockQueue,
}) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "1234567890123456789012345678901234567890": "Test Movie 720p bdrip",
      "2234567890123456789012345678901234567890": "Test Movie 1080p",
      "3234567890123456789012345678901234567890": "Test Movie",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle: "Test Movie 720p bdrip",
        }),
      }),
    ]),
  );
});

it("sorts ranked results using RTN", async ({ item, mockQueue }) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "1234567890123456789012345678901234567890": "Test Movie 720p aac",
      "2234567890123456789012345678901234567890": "Test Movie 720p DDP",
      "3234567890123456789012345678901234567890": "Test Movie 720p atmos",
    },
    rtnSettings: createSettings({
      customRanks: {
        audio: {
          aac: {
            rank: 10000,
          },
          atmos: {
            rank: 20000,
          },
          dolbyDigitalPlus: {
            rank: 100000,
          },
        },
      },
    }),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie 720p DDP",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie 720p atmos",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie 720p aac",
      }),
    }),
  ]);
});

it("uses the provided RTN settings and ranking model for ranking torrents", async ({
  item,
  mockQueue,
}) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "1234567890123456789012345678901234567890": "Test Movie 720p",
      "2234567890123456789012345678901234567890": "Test Movie 1080p",
      "3234567890123456789012345678901234567890": "Test Movie",
    },
    rtnSettings: createSettings({
      resolutions: {
        r1080p: false,
        r720p: false,
      },
    }),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie",
      }),
    }),
  ]);
});

it("sorts torrents by resolution, with higher quality resolutions ranked higher", async ({
  item,
  mockQueue,
}) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "1234567890123456789012345678901234567890": "Test Movie 720p",
      "2234567890123456789012345678901234567890": "Test Movie 1080p",
      "3234567890123456789012345678901234567890": "Test Movie",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie 1080p",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie 720p",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie",
      }),
    }),
  ]);
});
