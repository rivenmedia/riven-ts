import {
  createSettings,
  defaultRankingModel,
} from "@repo/util-rank-torrent-name";

import * as Sentry from "@sentry/node";
import { Job } from "bullmq";
import { expect, vi } from "vitest";

import { rivenTestContext as baseIt } from "../../../../../__tests__/test-context.ts";
import { createQueue } from "../../../../utilities/create-queue.ts";
import { rankStreamsProcessor } from "./rank-streams.processor.ts";

const it = baseIt
  .extend("mockQueue", ({}, { onCleanup }) => {
    const queue = createQueue("mock-queue");

    onCleanup(() => queue.close());

    return queue;
  })
  .extend("item", async ({ em, movie, factories: { streamFactory } }) => {
    movie.streams.set(
      streamFactory
        .each((stream, i) => {
          stream.infoHash = `${i.toString()}234567890123456789012345678901234567890`;
          stream.parsedData = {} as never;
        })
        .make(6),
    );

    await em.flush();

    return movie;
  });

it("does not include trashed streams", async ({ item, mockQueue }) => {
  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: item.id,
    streams: {
      "0234567890123456789012345678901234567890": `${item.title} 720p bdrip`,
      "1234567890123456789012345678901234567890": `${item.title} 1080p`,
      "2234567890123456789012345678901234567890": item.title,
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: new Sentry.Scope() },
    vi.fn(),
  );

  expect(result).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle: `${item.title} 720p bdrip`,
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
      "0234567890123456789012345678901234567890": `${item.title} 720p`,
      "1234567890123456789012345678901234567890": `${item.title} 720p DDP`,
      "2234567890123456789012345678901234567890": `${item.title} 1080p`,
      "3234567890123456789012345678901234567890": `${item.title} 1080p atmos`,
      "4234567890123456789012345678901234567890": item.title,
      "5234567890123456789012345678901234567890": `${item.title} mp3`,
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

  const result = await rankStreamsProcessor(
    { job, scope: new Sentry.Scope() },
    vi.fn(),
  );

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${item.title} 720p DDP`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${item.title} 1080p atmos`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${item.title} mp3`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${item.title} 1080p`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${item.title} 720p`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: item.title,
      }),
    }),
  ]);
});

it("handles foreign language movies with aliases correctly", async ({
  mockQueue,
  seeders: { seedMovie },
  factories: { streamFactory },
}) => {
  const itemWithAliases = await seedMovie(1, {
    title: "Foreign Movie",
    aliases: {
      es: ["Película Extranjera"],
      fr: ["Film Étranger"],
      jp: ["外国映画"],
    },
  });

  await streamFactory
    .each((stream, i) => {
      stream.infoHash = `a${i.toString()}34567890123456789012345678901234567890`;
      stream.parsedData = {} as never;
    })
    .create(3);

  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: itemWithAliases.id,
    streams: {
      a034567890123456789012345678901234567890:
        "Película Extranjera 1080p BluRay",
      a134567890123456789012345678901234567890: "Film Étranger 720p",
      a234567890123456789012345678901234567890: "Foreign Movie 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: new Sentry.Scope() },
    vi.fn(),
  );

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
  seeders: { seedShow },
  factories: { streamFactory },
}) => {
  const showWithAliases = await seedShow(1, {
    showData: {
      title: "Foreign Show",
      aliases: {
        es: ["Película Extranjera"],
        fr: ["Show Étranger"],
        jp: ["外国映画"],
      },
    },
  });

  await streamFactory
    .each((stream, i) => {
      stream.infoHash = `a${i.toString()}34567890123456789012345678901234567890`;
      stream.parsedData = {} as never;
    })
    .create(3);

  const job = await Job.create(mockQueue, "mock-rank-streams", {
    id: showWithAliases.id,
    streams: {
      a034567890123456789012345678901234567890:
        "Película Extranjera 1080p BluRay",
      a134567890123456789012345678901234567890: "Show Étranger 720p",
      a234567890123456789012345678901234567890: "Foreign Show 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: new Sentry.Scope() },
    vi.fn(),
  );

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
