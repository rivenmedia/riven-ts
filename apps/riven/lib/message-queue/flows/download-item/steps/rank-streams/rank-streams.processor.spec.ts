import {
  ItemRequest,
  type MediaItem,
  Movie,
  Show,
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
  mockQueue: async ({}, use) => {
    const queue = createQueue("mock-queue");

    await use(queue);

    await queue.close();
  },
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
      tmdbId: "12345",
      isRequested: true,
      fullTitle: "Test Movie",
      state: "indexed",
    });

    for (let i = 1; i <= 6; i++) {
      em.create(Stream, {
        infoHash: `${i.toString()}234567890123456789012345678901234567890`,
        parsedData: {} as never,
      });
    }

    await em.flush();

    await use(item);
  },
});

it("does not include trashed streams", async ({ item, mockQueue }) => {
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

it("sorts torrents by resolution and rank within the same resolution", async ({
  item,
  mockQueue,
}) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "1234567890123456789012345678901234567890": "Test Movie 720p",
      "2234567890123456789012345678901234567890": "Test Movie 720p DDP",
      "3234567890123456789012345678901234567890": "Test Movie 1080p",
      "4234567890123456789012345678901234567890": "Test Movie 1080p atmos",
      "5234567890123456789012345678901234567890": "Test Movie",
      "6234567890123456789012345678901234567890": "Test Movie mp3",
    },
    rtnSettings: createSettings({
      customRanks: {
        audio: {
          mp3: {
            fetch: true,
            rank: 10000,
          },
          atmos: {
            fetch: true,
            rank: 20000,
          },
          dolbyDigitalPlus: {
            fetch: true,
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
        rawTitle: "Test Movie 1080p atmos",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Test Movie mp3",
      }),
    }),
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

it("handles foreign language movies with aliases correctly", async ({
  mockQueue,
}) => {
  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "movie",
  });

  const itemWithAliases = em.create(Movie, {
    title: "Foreign Movie",
    contentRating: "g",
    itemRequest,
    tmdbId: "67890",
    aliases: {
      es: ["Película Extranjera"],
      fr: ["Film Étranger"],
      jp: ["外国映画"],
    },
    isRequested: true,
    fullTitle: "Foreign Movie",
    state: "indexed",
  });

  for (let i = 1; i <= 3; i++) {
    em.create(Stream, {
      infoHash: `a${i.toString()}34567890123456789012345678901234567890`,
      parsedData: {} as never,
    });
  }

  await em.flush();

  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: itemWithAliases.id,
    streams: {
      a134567890123456789012345678901234567890:
        "Película Extranjera 1080p BluRay",
      a234567890123456789012345678901234567890: "Film Étranger 720p",
      a334567890123456789012345678901234567890: "Foreign Movie 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Película Extranjera 1080p BluRay",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Foreign Movie 1080p",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Film Étranger 720p",
      }),
    }),
  ]);
});

it("handles foreign language shows with aliases correctly", async ({
  mockQueue,
}) => {
  const em = database.em.fork();

  const itemRequest = em.create(ItemRequest, {
    requestedBy: "@repo/plugin-test",
    state: "completed",
    type: "show",
  });

  const itemWithAliases = em.create(Show, {
    title: "Foreign Show",
    contentRating: "tv-14",
    itemRequest,
    tvdbId: "67890",
    status: "ended",
    aliases: {
      es: ["Película Extranjera"],
      fr: ["Show Étranger"],
      jp: ["外国映画"],
    },
    isRequested: true,
    fullTitle: "Foreign Show",
    state: "indexed",
    keepUpdated: false,
  });

  for (let i = 1; i <= 3; i++) {
    em.create(Stream, {
      infoHash: `a${i.toString()}34567890123456789012345678901234567890`,
      parsedData: {} as never,
    });
  }

  await em.flush();

  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: itemWithAliases.id,
    streams: {
      a134567890123456789012345678901234567890:
        "Película Extranjera 1080p BluRay",
      a234567890123456789012345678901234567890: "Show Étranger 720p",
      a334567890123456789012345678901234567890: "Foreign Show 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor({ job }, vi.fn());

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Película Extranjera 1080p BluRay",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Foreign Show 1080p",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Show Étranger 720p",
      }),
    }),
  ]);
});
