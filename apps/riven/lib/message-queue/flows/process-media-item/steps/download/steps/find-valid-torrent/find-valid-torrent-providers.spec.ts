import { DataSourceMap } from "@repo/util-plugin-sdk";
import {
  createRankingModel,
  createSettings,
  rankTorrent,
} from "@repo/util-rank-torrent-name";

import { DelayedError } from "bullmq";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { MapItemsToFilesSandboxedJob } from "#message-queue/sandboxed-jobs/jobs/map-items-to-files/map-items-to-files.schema.ts";
import { ValidateTorrentFilesSandboxedJob } from "#message-queue/sandboxed-jobs/jobs/validate-torrent-files/validate-torrent-files.schema.ts";

import { findValidTorrentProcessor } from "./find-valid-torrent.processor.ts";
import { FindValidTorrentFlow } from "./find-valid-torrent.schema.ts";

import type { MediaItemDownloadProviderListRequestedResponse } from "@repo/util-plugin-sdk/schemas/events/media-item.download.provider-list-requested.event";
import type { DebridFile } from "@repo/util-plugin-sdk/schemas/torrents/debrid-file";
import type { Job } from "bullmq";

const createTorrentFile = () =>
  ({
    name: "Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
    size: 123_456_789,
    path: "/Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
    link: "https://example.com/Example.Torrent.2024.1080p.WEBRip.x264-GROUP.mkv",
  }) satisfies DebridFile;

interface ProviderJobData {
  provider: string | null;
}

const it = baseIt.extend(
  "setup",
  async ({
    createFlowWorker,
    createMockJob,
    createMockJobChildKey,
    createPluginWorker,
    mockFlowProcessorContext,
    scrapedMovieContext: {
      scrapedMovie,
      streams: [stream],
    },
  }) => {
    expect.assert(stream);

    createFlowWorker(FindValidTorrentFlow, findValidTorrentProcessor);

    const { plugin: testPlugin } = await import("@repo/plugin-test");

    mockFlowProcessorContext.plugins.set(testPlugin.name, {
      config: testPlugin,
      dataSources: new DataSourceMap(),
      status: "valid",
    });

    const validatedFile = {
      ...createTorrentFile(),
      matchedMediaItemId: scrapedMovie.id,
      isCachedFile: false,
    };

    const validate = vi
      .fn<() => Promise<unknown>>()
      .mockResolvedValue({ success: true, files: [validatedFile] });

    createFlowWorker(ValidateTorrentFilesSandboxedJob, validate);

    createFlowWorker(
      MapItemsToFilesSandboxedJob,
      vi.fn().mockResolvedValue({
        movies: { "0": createTorrentFile() },
        episodes: {},
      }),
    );

    const mockProviderList = (
      response: MediaItemDownloadProviderListRequestedResponse,
    ) =>
      createPluginWorker(
        "riven.media-item.download.provider-list-requested",
        "@repo/plugin-test",
        vi.fn().mockResolvedValue(response),
      );

    const cacheCheck = vi.fn<(job: Job<ProviderJobData>) => Promise<unknown>>(
      async () => Promise.resolve({}),
    );
    const download = vi.fn<(job: Job<ProviderJobData>) => Promise<unknown>>(
      async () =>
        Promise.resolve({
          success: true,
          data: { torrentId: "mock-torrent-id", files: [createTorrentFile()] },
        }),
    );

    createPluginWorker(
      "riven.media-item.download.cache-check-requested",
      "@repo/plugin-test",
      cacheCheck,
    );
    createPluginWorker(
      "riven.media-item.download.requested",
      "@repo/plugin-test",
      download,
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
          createRankingModel({ webrip: 0, avc: 0 }),
        ),
      ],
    });

    const moveToDelayed = vi.spyOn(job, "moveToDelayed").mockResolvedValue();

    return {
      cacheCheck,
      download,
      infoHash: stream.infoHash,
      job,
      mockProviderList,
      moveToDelayed,
      validate,
      validatedFile,
    };
  },
);

it("downloads from the first provider that has the torrent cached", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  setup: {
    cacheCheck,
    download,
    infoHash,
    job,
    mockProviderList,
    validatedFile,
  },
}) => {
  mockProviderList({ providers: ["alpha", "beta"], rateLimitedProviders: {} });

  cacheCheck.mockImplementation(async ({ data: { provider } }) =>
    Promise.resolve(
      provider === "beta" ? { [infoHash]: [createTorrentFile()] } : {},
    ),
  );

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(result).toStrictEqual({
    plugin: "@repo/plugin-test",
    result: {
      torrentId: "mock-torrent-id",
      infoHash,
      files: [validatedFile],
      provider: "beta",
    },
  });

  expect(
    cacheCheck.mock.calls.map(([{ data }]) => data.provider),
  ).toStrictEqual(["alpha", "beta"]);
  expect(download.mock.calls.map(([{ data }]) => data.provider)).toStrictEqual([
    "beta",
  ]);
});

it("attempts uncached downloads when unknown downloads are allowed", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  overrideRuntimeSettings,
  setup: { download, infoHash, job, mockProviderList },
}) => {
  overrideRuntimeSettings({
    general: { scraping: { attemptUnknownDownloads: true } },
  });

  mockProviderList({ providers: ["alpha"], rateLimitedProviders: {} });

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope, token: "test-token" },
    mockFlowProcessorContext,
  );

  expect(result).toMatchObject({ result: { infoHash, provider: "alpha" } });
  expect(download).toHaveBeenCalledOnce();
});

it("marks the info hash as failed when the plugin has no providers configured", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  setup: {
    cacheCheck,
    download,
    infoHash,
    job,
    mockProviderList,
    moveToDelayed,
  },
}) => {
  mockProviderList({ providers: [], rateLimitedProviders: {} });

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).resolves.toBeNull();

  expect(job.data.failedInfoHashes).toStrictEqual([infoHash]);
  expect(cacheCheck).not.toHaveBeenCalled();
  expect(download).not.toHaveBeenCalled();
  expect(moveToDelayed).not.toHaveBeenCalled();
});

it("delays the job until the earliest rate limit lifts when every provider is rate limited", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  setup: { download, job, mockProviderList, moveToDelayed },
}) => {
  mockProviderList({
    providers: [],
    rateLimitedProviders: { alpha: 120_000, beta: 60_000 },
  });

  const before = DateTime.utc().plus({ milliseconds: 60_000 }).toMillis();

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).rejects.toBeInstanceOf(DelayedError);

  const after = DateTime.utc().plus({ milliseconds: 60_000 }).toMillis();

  expect(moveToDelayed).toHaveBeenCalledExactlyOnceWith(
    expect.any(Number),
    "test-token",
  );

  const [delayUntil] = moveToDelayed.mock.calls[0] ?? [];

  expect(delayUntil).toBeGreaterThanOrEqual(before);
  expect(delayUntil).toBeLessThanOrEqual(after);
  expect(download).not.toHaveBeenCalled();
  expect(job.data.failedInfoHashes).toStrictEqual([]);
});

it("retries the info hash after the rate limit lifts when the remaining providers fail", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  setup: {
    cacheCheck,
    download,
    infoHash,
    job,
    mockProviderList,
    moveToDelayed,
  },
}) => {
  cacheCheck.mockResolvedValue({ [infoHash]: [createTorrentFile()] });

  mockProviderList({
    providers: ["beta"],
    rateLimitedProviders: { alpha: 30_000 },
  });

  download.mockResolvedValue({ success: false, statusCode: 503 });

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).rejects.toBeInstanceOf(DelayedError);

  expect(download.mock.calls.map(([{ data }]) => data.provider)).toStrictEqual([
    "beta",
  ]);
  expect(moveToDelayed).toHaveBeenCalledOnce();
  // The rate limited provider has not been tried, so the hash must not be marked as failed
  expect(job.data.failedInfoHashes).toStrictEqual([]);
});

it("blacklists the stream when the provider reports the torrent as dead", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: { scrapedMovie },
  services: { streamService },
  setup: { cacheCheck, download, infoHash, job, mockProviderList },
}) => {
  cacheCheck.mockResolvedValue({ [infoHash]: [createTorrentFile()] });
  download.mockResolvedValue({ success: false, statusCode: 404 });

  mockProviderList({ providers: ["alpha"], rateLimitedProviders: {} });

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).resolves.toBeNull();

  expect(job.data.failedInfoHashes).toStrictEqual([infoHash]);

  await expect(
    streamService.isStreamBlacklisted({
      mediaItem: scrapedMovie.id,
      stream: infoHash,
      plugin: "@repo/plugin-test",
      provider: "alpha",
    }),
  ).resolves.toBe(true);
});

it("does not blacklist the stream when the download fails temporarily", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: { scrapedMovie },
  services: { streamService },
  setup: { cacheCheck, download, infoHash, job, mockProviderList },
}) => {
  cacheCheck.mockResolvedValue({ [infoHash]: [createTorrentFile()] });
  download.mockResolvedValue({ success: false, statusCode: 503 });

  mockProviderList({ providers: ["alpha"], rateLimitedProviders: {} });

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).resolves.toBeNull();

  expect(download).toHaveBeenCalledOnce();

  await expect(
    streamService.isStreamBlacklisted({
      mediaItem: scrapedMovie.id,
      stream: infoHash,
      plugin: "@repo/plugin-test",
      provider: "alpha",
    }),
  ).resolves.toBe(false);
});

it("stops trying other providers once the torrent's files fail validation", async ({
  mockFlowProcessorContext,
  mockSentryScope,
  setup: { cacheCheck, download, infoHash, job, mockProviderList, validate },
}) => {
  cacheCheck.mockResolvedValue({ [infoHash]: [createTorrentFile()] });
  validate.mockResolvedValue({
    success: false,
    reason: "No files matched the requested media item",
  });

  mockProviderList({ providers: ["alpha", "beta"], rateLimitedProviders: {} });

  const logSpy = vi.spyOn(job, "log");

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).resolves.toBeNull();

  expect(
    cacheCheck.mock.calls.map(([{ data }]) => data.provider),
  ).toStrictEqual(["alpha"]);
  expect(download).not.toHaveBeenCalled();
  expect(job.data.failedInfoHashes).toStrictEqual([infoHash]);
  expect(logSpy).toHaveBeenCalledWith(
    `${infoHash} failed validation: No files matched the requested media item`,
  );
});

it("delays retrying until the earliest rate limit across every info hash lifts", async ({
  createMockJobChildKey,
  mockFlowProcessorContext,
  mockSentryScope,
  scrapedMovieContext: { streams },
  createPluginWorker,
  setup: { cacheCheck, download, job, moveToDelayed },
}) => {
  const [firstStream, secondStream] = streams;

  expect.assert(firstStream && secondStream);

  const rankingModel = createRankingModel({ webrip: 0, avc: 0 });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.rank-streams")]: [
      firstStream,
      secondStream,
    ].map(({ infoHash }) =>
      rankTorrent(
        "Example.Torrent.2024.1080p.WEBRip.x264-GROUP",
        infoHash,
        "Example Torrent",
        {},
        createSettings(),
        rankingModel,
      ),
    ),
  });

  cacheCheck.mockResolvedValue({
    [firstStream.infoHash]: [createTorrentFile()],
    [secondStream.infoHash]: [createTorrentFile()],
  });
  download.mockResolvedValue({ success: false, statusCode: 503 });

  // The rate limit reported whilst checking the second info hash lifts sooner than the first
  const providerList = vi
    .fn<() => Promise<unknown>>()
    .mockResolvedValueOnce({
      providers: ["beta"],
      rateLimitedProviders: { alpha: 300_000 },
    })
    .mockResolvedValueOnce({
      providers: ["beta"],
      rateLimitedProviders: { alpha: 60_000 },
    });

  createPluginWorker(
    "riven.media-item.download.provider-list-requested",
    "@repo/plugin-test",
    providerList,
  );

  const earliest = DateTime.utc().plus({ milliseconds: 60_000 }).toMillis();

  await expect(
    findValidTorrentProcessor(
      { job, scope: mockSentryScope, token: "test-token" },
      mockFlowProcessorContext,
    ),
  ).rejects.toBeInstanceOf(DelayedError);

  expect(download).toHaveBeenCalledTimes(2);
  expect(moveToDelayed).toHaveBeenCalledOnce();
  expect(providerList).toHaveBeenCalledTimes(2);

  const [delayUntil] = moveToDelayed.mock.calls[0] ?? [];

  expect(delayUntil).toBeGreaterThanOrEqual(earliest);
  expect(delayUntil).toBeLessThan(earliest + 120_000);
  expect(job.data.failedInfoHashes).toStrictEqual([]);
});
