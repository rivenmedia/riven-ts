import {
  createSettings,
  defaultRankingModel,
} from "@repo/util-rank-torrent-name";

import { expect, vi } from "vitest";

import { it as baseIt } from "../../../../../__tests__/test-context.ts";
import { rankStreamsProcessor } from "./rank-streams.processor.ts";

const it = baseIt.extend(
  "item",
  async ({ em, indexedMovie, factories: { streamFactory } }) => {
    indexedMovie.streams.set(
      streamFactory
        .each((stream, i) => {
          stream.infoHash = `${i.toString()}234567890123456789012345678901234567890`;
          stream.parsedData = {} as never;
        })
        .make(6),
    );

    await em.flush();

    return indexedMovie;
  },
);

it("does not include trashed streams", async ({
  createMockJob,
  item,
  mockSentryScope,
}) => {
  const job = await createMockJob({
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
    { job, scope: mockSentryScope },
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
  createMockJob,
  item,
  mockSentryScope,
}) => {
  const job = await createMockJob({
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
    { job, scope: mockSentryScope },
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
  createMockJob,
  seeders: { seedForeignLanguageMovie },
  factories: { streamFactory },
  mockSentryScope,
}) => {
  const foreignLanguageMovie = await seedForeignLanguageMovie();

  await streamFactory
    .each((stream, i) => {
      stream.infoHash = `a${i.toString()}34567890123456789012345678901234567890`;
      stream.parsedData = {} as never;
    })
    .create(3);

  const job = await createMockJob({
    id: foreignLanguageMovie.id,
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
    { job, scope: mockSentryScope },
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
  createMockJob,
  seeders: { seedForeignLanguageShow },
  factories: { streamFactory },
  mockSentryScope,
}) => {
  const foreignLanguageShow = await seedForeignLanguageShow();

  await streamFactory
    .each((stream, i) => {
      stream.infoHash = `a${i.toString()}34567890123456789012345678901234567890`;
      stream.parsedData = {} as never;
    })
    .create(3);

  const job = await createMockJob({
    id: foreignLanguageShow.id,
    streams: {
      a034567890123456789012345678901234567890:
        "Espectáculo Extranjero 1080p BluRay",
      a134567890123456789012345678901234567890: "Spectacle Étranger 720p",
      a234567890123456789012345678901234567890: "Foreign Show 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: mockSentryScope },
    vi.fn(),
  );

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Espectáculo Extranjero 1080p BluRay",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Foreign Show 1080p",
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: "Spectacle Étranger 720p",
      }),
    }),
  ]);
});
