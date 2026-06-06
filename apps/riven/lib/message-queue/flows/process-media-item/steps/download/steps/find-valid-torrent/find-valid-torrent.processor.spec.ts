import { DataSourceMap } from "@repo/util-plugin-sdk";
import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";
import {
  type RankedResult,
  createRankingModel,
  createSettings,
  rankTorrent,
} from "@repo/util-rank-torrent-name";

import { type TypedJobNode, UnrecoverableError } from "bullmq";
import { expect, vi } from "vitest";

import { it } from "../../../../../../../__tests__/test-context.ts";
import { MapItemsToFilesSandboxedJob } from "../../../../../../sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import { ValidateTorrentFilesSandboxedJob } from "../../../../../../sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.schema.ts";
import { findValidTorrentProcessor } from "./find-valid-torrent.processor.ts";
import { FindValidTorrentFlow } from "./find-valid-torrent.schema.ts";

import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";

it.beforeEach(async ({ createFlowWorker, mockFlowProcessorContext }) => {
  createFlowWorker(FindValidTorrentFlow, findValidTorrentProcessor);

  const { default: testPlugin } = await import("@repo/plugin-test");

  // Disable cache check and provider hooks to simplify tests
  testPlugin.hooks["riven.media-item.download.provider-list-requested"] =
    undefined;
  testPlugin.hooks["riven.media-item.download.cache-check-requested"] =
    undefined;

  mockFlowProcessorContext.plugins.set(testPlugin.name, {
    config: testPlugin,
    dataSources: new DataSourceMap(),
    status: "valid",
  });
});

it("throws an UnrecoverableError if no ranked streams are available", async ({
  createMockJob,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: { scrapedMovie },
}) => {
  const job = await createMockJob({
    failedInfoHashes: [],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).rejects.toThrow(UnrecoverableError);
});

it("does not attempt previously failed info hashes", async ({
  createMockJob,
  createPluginWorker,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream1, stream2, stream3],
  },
  createMockJobChildKey,
}) => {
  expect.assert(stream1);
  expect.assert(stream2);
  expect.assert(stream3);

  const downloadRequestedSpy = vi.fn().mockResolvedValue({
    success: true,
    data: {
      torrentId: "mock-torrent-id",
      files: [],
    },
  });

  createPluginWorker(
    "riven.media-item.download.requested",
    "@repo/plugin-test",
    downloadRequestedSpy,
  );

  const job = await createMockJob({
    failedInfoHashes: [stream3.infoHash],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream1.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream2.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream3.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
    ] satisfies RankedResult[],
  });

  await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(downloadRequestedSpy).toHaveBeenCalledTimes(2);

  for (const [jobArg] of downloadRequestedSpy.mock.calls) {
    expect(
      (jobArg as TypedJobNode<{ infoHash: string }>["job"]).data.infoHash,
    ).not.toBe(stream3.infoHash);
  }
});

it.todo(
  "iterates through unchecked hashes and available downloaders sequentially",
);

it("returns the plugin and validated result on successful validation", async ({
  createMockJob,
  createFlowWorker,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream],
  },
  createPluginWorker,
  createMockJobChildKey,
}) => {
  expect.assert(stream);

  const expectedFile = {
    name: "Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
    size: 123456789,
    path: "/Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
    link: "https://example.com/Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
  } satisfies DebridFile;

  createPluginWorker(
    "riven.media-item.download.requested",
    "@repo/plugin-test",
    vi.fn().mockResolvedValue({
      success: true,
      data: {
        torrentId: "mock-torrent-id",
        files: [expectedFile],
      },
    }),
  );

  createFlowWorker(
    ValidateTorrentFilesSandboxedJob,
    vi.fn().mockResolvedValue({
      success: true,
      files: [
        {
          ...expectedFile,
          matchedMediaItemId: scrapedMovie.id,
          isCachedFile: false,
        },
      ],
    }),
  );

  createFlowWorker(
    MapItemsToFilesSandboxedJob,
    vi.fn().mockResolvedValue({
      movies: { "0": expectedFile },
      episodes: {},
    }),
  );

  const job = await createMockJob({
    failedInfoHashes: [],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
    ] satisfies RankedResult[],
  });

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(result).toEqual({
    plugin: "@repo/plugin-test",
    result: {
      torrentId: "mock-torrent-id",
      infoHash: stream.infoHash,
      files: [
        {
          ...expectedFile,
          matchedMediaItemId: scrapedMovie.id,
          isCachedFile: false,
        },
      ],
      provider: null,
    },
  });
});

it("updates job data with the failed info hash when an invalid torrent is returned", async ({
  createPluginWorker,
  createMockJob,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream],
  },
  createMockJobChildKey,
}) => {
  expect.assert(stream);

  createPluginWorker(
    "riven.media-item.download.requested",
    "@repo/plugin-test",
    vi.fn().mockResolvedValue({
      success: true,
      data: {
        torrentId: "mock-torrent-id",
        files: [],
      },
    }),
  );

  const job = await createMockJob({
    failedInfoHashes: [],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
    ] satisfies RankedResult[],
  });

  await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(job.data.failedInfoHashes).toEqual([stream.infoHash]);
});

it("returns null if no valid torrent is found after trying all plugins", async ({
  createMockJob,
  createPluginWorker,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream],
  },
  createMockJobChildKey,
}) => {
  expect.assert(stream);

  createPluginWorker(
    "riven.media-item.download.requested",
    "@repo/plugin-test",
    vi.fn().mockResolvedValue({
      success: true,
      data: {
        torrentId: "mock-torrent-id",
        files: [],
      },
    }),
  );

  const job = await createMockJob({
    failedInfoHashes: [],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream.infoHash,
        "Another Torrent Name",
        {},
        createSettings({ options: { titleSimilarity: 0 } }),
        createRankingModel(),
      ),
    ] satisfies RankedResult[],
  });

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(result).toBeNull();
});

it("does not attempt to re-download blacklisted streams", async ({
  em,
  createMockJob,
  createPluginWorker,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: {
    scrapedMovie,
    streams: [stream1, stream2, blacklistedStream],
  },
  createMockJobChildKey,
}) => {
  expect.assert(stream1);
  expect.assert(stream2);
  expect.assert(blacklistedStream);

  const downloadRequestedSpy = vi.fn().mockResolvedValue({
    success: true,
    data: {
      torrentId: "mock-torrent-id",
      files: [],
    },
  });

  createPluginWorker(
    "riven.media-item.download.requested",
    "@repo/plugin-test",
    downloadRequestedSpy,
  );

  em.create(BlacklistedStream, {
    stream: blacklistedStream,
    mediaItem: scrapedMovie,
    plugin: "@repo/plugin-test",
  });

  await em.flush();

  const job = await createMockJob({
    failedInfoHashes: [],
    id: scrapedMovie.id,
    itemTitle: scrapedMovie.title,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream1.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        stream2.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        blacklistedStream.infoHash,
        "Example Torrent",
        {},
        createSettings(),
        createRankingModel(),
      ),
    ] satisfies RankedResult[],
  });

  await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(downloadRequestedSpy).toHaveBeenCalledTimes(2);

  for (const [jobArg] of downloadRequestedSpy.mock.calls) {
    expect(
      (jobArg as TypedJobNode<{ infoHash: string }>["job"]).data.infoHash,
    ).not.toBe(blacklistedStream.infoHash);
  }
});
