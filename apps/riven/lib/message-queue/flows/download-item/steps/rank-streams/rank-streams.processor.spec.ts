import {
  createSettings,
  defaultRankingModel,
} from "@repo/util-rank-torrent-name";

import { expect, vi } from "vitest";

import { it as baseIt } from "../../../../../__tests__/test-context.ts";
import { rankStreamsProcessor } from "./rank-streams.processor.ts";

const it = baseIt.extend(
  "streams",
  { auto: true },
  ({ factories: { streamFactory } }) => streamFactory.create(6),
);

it("does not include trashed streams", async ({
  createMockJob,
  streams,
  indexedMovieContext: { indexedMovie },
  mockSentryScope,
  services,
}) => {
  expect.assert(streams[0]);
  expect.assert(streams[1]);
  expect.assert(streams[2]);

  const job = await createMockJob({
    id: indexedMovie.id,
    streams: {
      [streams[0].infoHash]: `${indexedMovie.title} 720p bdrip`,
      [streams[1].infoHash]: `${indexedMovie.title} 1080p`,
      [streams[2].infoHash]: indexedMovie.title,
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services },
  );

  expect(result).toEqual(
    expect.not.arrayContaining([
      expect.objectContaining({
        data: expect.objectContaining({
          rawTitle: `${indexedMovie.title} 720p bdrip`,
        }),
      }),
    ]),
  );
});

it("sorts torrents by resolution and rank within the same resolution", async ({
  createMockJob,
  indexedMovieContext: { indexedMovie },
  mockSentryScope,
  streams,
  services,
}) => {
  expect.assert(streams[0]);
  expect.assert(streams[1]);
  expect.assert(streams[2]);
  expect.assert(streams[3]);
  expect.assert(streams[4]);
  expect.assert(streams[5]);

  const job = await createMockJob({
    id: indexedMovie.id,
    streams: {
      [streams[0].infoHash]: `${indexedMovie.title} 720p`,
      [streams[1].infoHash]: `${indexedMovie.title} 720p DDP`,
      [streams[2].infoHash]: `${indexedMovie.title} 1080p`,
      [streams[3].infoHash]: `${indexedMovie.title} 1080p atmos`,
      [streams[4].infoHash]: indexedMovie.title,
      [streams[5].infoHash]: `${indexedMovie.title} mp3`,
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
    { sendEvent: vi.fn(), services },
  );

  expect(result).toEqual([
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${indexedMovie.title} 720p DDP`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${indexedMovie.title} 1080p atmos`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${indexedMovie.title} mp3`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${indexedMovie.title} 1080p`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: `${indexedMovie.title} 720p`,
      }),
    }),
    expect.objectContaining({
      data: expect.objectContaining({
        rawTitle: indexedMovie.title,
      }),
    }),
  ]);
});

it("handles foreign language movies with aliases correctly", async ({
  createMockJob,
  seeders: { seedForeignLanguageMovie },
  streams,
  mockSentryScope,
  services,
}) => {
  expect.assert(streams[0]);
  expect.assert(streams[1]);
  expect.assert(streams[2]);

  const { movie: foreignLanguageMovie } = await seedForeignLanguageMovie();

  const job = await createMockJob({
    id: foreignLanguageMovie.id,
    streams: {
      [streams[0].infoHash]: "Película Extranjera 1080p BluRay",
      [streams[1].infoHash]: "Film Étranger 720p",
      [streams[2].infoHash]: "Foreign Movie 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services },
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
  streams,
  mockSentryScope,
  services,
}) => {
  expect.assert(streams[0]);
  expect.assert(streams[1]);
  expect.assert(streams[2]);

  const { show: foreignLanguageShow } = await seedForeignLanguageShow();

  const job = await createMockJob({
    id: foreignLanguageShow.id,
    streams: {
      [streams[0].infoHash]: "Espectáculo Extranjero 1080p BluRay",
      [streams[1].infoHash]: "Spectacle Étranger 720p",
      [streams[2].infoHash]: "Foreign Show 1080p",
    },
    rtnSettings: createSettings(),
    rtnRankingModel: defaultRankingModel,
  });

  const result = await rankStreamsProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services },
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
