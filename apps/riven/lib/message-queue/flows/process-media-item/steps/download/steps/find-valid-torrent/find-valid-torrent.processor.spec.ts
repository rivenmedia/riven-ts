import { expect, vi } from "vitest";

import { it } from "../../../../../../../__tests__/test-context.ts";
import { InvalidTorrentError } from "../../../../../../sandboxed-jobs/jobs/validate-torrent-files/utilities/validate-torrent-files.ts";
import { findValidTorrentProcessor } from "./find-valid-torrent.processor.ts";

import type { ValidPlugin } from "../../../../../../../types/plugins.ts";
import type { RankedResult } from "@repo/util-rank-torrent-name";

vi.mock("./utilities/get-cached-torrent-files.ts");
vi.mock("./utilities/get-plugin-download-result.ts");
vi.mock("./utilities/get-plugin-provider-list.ts");
vi.mock("./utilities/get-valid-torrent-files.ts");

const testPluginSymbol = Symbol.for("@repo/plugin-test");

function createTestPluginMap(hooks: Record<string, unknown> = {}) {
  const pluginConfig = {
    name: { description: "@repo/plugin-test" },
    hooks: {
      "riven.media-item.download.requested": vi.fn(),
      ...hooks,
    },
  };

  const plugin: ValidPlugin = {
    status: "valid",
    config: pluginConfig as never,
    dataSources: new Map() as never,
  };

  return new Map([[testPluginSymbol, plugin]]);
}

function createRankedStreams(
  ...hashes: string[]
): Record<string, RankedResult[]> {
  return {
    "child-job-key": hashes.map(
      (hash) =>
        ({
          hash,
          title: `Test.Movie.2024.1080p.WEB-DL-${hash.slice(0, 4)}`,
          rank: 100,
        }) as unknown as RankedResult,
    ),
  };
}

it("throws an UnrecoverableError if no ranked streams are available", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  await expect(() =>
    findValidTorrentProcessor(
      { job, scope: mockSentryScope },
      { sendEvent: vi.fn(), services, plugins: new Map() },
    ),
  ).rejects.toThrow("No streams found");
});

it("returns null when all info hashes have already failed", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash = "a".repeat(40);

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [hash],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash),
  );

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
  );

  expect(result).toBeNull();
});

it("returns the plugin and validated result on successful download", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash = "b".repeat(40);

  const { getPluginDownloadResult } =
    await import("./utilities/get-plugin-download-result.ts");
  const { getValidTorrentFiles } =
    await import("./utilities/get-valid-torrent-files.ts");

  const matchedFiles = [
    {
      name: "movie.mkv",
      path: "/movie.mkv",
      size: 1000,
      link: "http://example.com/movie.mkv",
      matchedMediaItemId: movie.id,
      isCachedFile: false,
    },
  ];

  vi.mocked(getPluginDownloadResult).mockResolvedValue({
    torrentId: "torrent-123",
    files: [
      {
        name: "movie.mkv",
        path: "/movie.mkv",
        size: 1000,
        link: "http://example.com/movie.mkv",
      },
    ],
  } as never);

  vi.mocked(getValidTorrentFiles).mockResolvedValue(matchedFiles as never);

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash),
  );

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
  );

  expect(result).toEqual({
    plugin: "@repo/plugin-test",
    result: {
      torrentId: "torrent-123",
      infoHash: hash,
      files: matchedFiles,
      provider: null,
    },
  });
});

it("uses cached torrent files when cache check hook is available", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash = "c".repeat(40);

  const { getCachedTorrentFiles } =
    await import("./utilities/get-cached-torrent-files.ts");
  const { getValidTorrentFiles } =
    await import("./utilities/get-valid-torrent-files.ts");
  const { getPluginDownloadResult } =
    await import("./utilities/get-plugin-download-result.ts");

  const matchedFiles = [
    {
      name: "movie.mkv",
      path: "/movie.mkv",
      size: 1000,
      link: "http://example.com/movie.mkv",
      matchedMediaItemId: movie.id,
      isCachedFile: true,
    },
  ];

  vi.mocked(getCachedTorrentFiles).mockResolvedValue({
    [hash]: [{ name: "movie.mkv", path: "/movie.mkv", size: 1000 }],
  } as never);

  vi.mocked(getValidTorrentFiles).mockResolvedValue(matchedFiles as never);

  vi.mocked(getPluginDownloadResult).mockResolvedValue({
    torrentId: "torrent-456",
    files: [
      {
        name: "movie.mkv",
        path: "/movie.mkv",
        size: 1000,
        link: "http://example.com/movie.mkv",
      },
    ],
  } as never);

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash),
  );

  const plugins = createTestPluginMap({
    "riven.media-item.download.cache-check-requested": vi.fn(),
  });

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins },
  );

  expect(getCachedTorrentFiles).toHaveBeenCalled();
  expect(result).toEqual(
    expect.objectContaining({
      plugin: "@repo/plugin-test",
      result: expect.objectContaining({
        infoHash: hash,
        files: matchedFiles,
      }),
    }),
  );
});

it("updates job data with the failed info hash when validation fails for all plugins", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash = "d".repeat(40);

  const { getPluginDownloadResult } =
    await import("./utilities/get-plugin-download-result.ts");

  vi.mocked(getPluginDownloadResult).mockRejectedValue(
    new Error("Download failed"),
  );

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash),
  );

  const updateDataSpy = vi.spyOn(job, "updateData").mockResolvedValue();

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
  );

  expect(result).toBeNull();
  expect(updateDataSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      failedInfoHashes: [hash],
    }),
  );
});

it("skips remaining plugins for an info hash when InvalidTorrentError is thrown", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash1 = "e".repeat(40);
  const hash2 = "f".repeat(40);

  const { getPluginDownloadResult } =
    await import("./utilities/get-plugin-download-result.ts");

  // First hash throws InvalidTorrentError, second should still be tried
  vi.mocked(getPluginDownloadResult)
    .mockRejectedValueOnce(new InvalidTorrentError("bad files"))
    .mockRejectedValueOnce(new Error("Download failed"));

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash1, hash2),
  );

  vi.spyOn(job, "updateData").mockResolvedValue();

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
  );

  expect(result).toBeNull();
});

it("queries providers when provider list hook is available", async ({
  createMockJob,
  mockSentryScope,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();
  const hash = "a1".repeat(20);

  const { getPluginProviderList } =
    await import("./utilities/get-plugin-provider-list.ts");
  const { getPluginDownloadResult } =
    await import("./utilities/get-plugin-download-result.ts");
  const { getValidTorrentFiles } =
    await import("./utilities/get-valid-torrent-files.ts");

  vi.mocked(getPluginProviderList).mockResolvedValue([
    "provider-a",
    "provider-b",
  ]);

  const matchedFiles = [
    {
      name: "movie.mkv",
      path: "/movie.mkv",
      size: 1000,
      link: "http://example.com/movie.mkv",
      matchedMediaItemId: movie.id,
      isCachedFile: false,
    },
  ];

  // First provider fails, second succeeds
  vi.mocked(getPluginDownloadResult)
    .mockRejectedValueOnce(new Error("Provider A failed"))
    .mockResolvedValueOnce({
      torrentId: "torrent-789",
      files: [
        {
          name: "movie.mkv",
          path: "/movie.mkv",
          size: 1000,
          link: "http://example.com/movie.mkv",
        },
      ],
    } as never);

  vi.mocked(getValidTorrentFiles).mockResolvedValue(matchedFiles as never);

  const job = await createMockJob({
    id: movie.id,
    itemTitle: "Test Movie",
    failedInfoHashes: [],
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue(
    createRankedStreams(hash),
  );

  const plugins = createTestPluginMap({
    "riven.media-item.download.provider-list-requested": vi.fn(),
  });

  const result = await findValidTorrentProcessor(
    { job, scope: mockSentryScope },
    { sendEvent: vi.fn(), services, plugins },
  );

  expect(getPluginProviderList).toHaveBeenCalled();
  expect(result).toEqual(
    expect.objectContaining({
      plugin: "@repo/plugin-test",
      result: expect.objectContaining({
        provider: "provider-b",
      }),
    }),
  );
});

it.todo(
  "throws UnrecoverableError if no valid torrent found after trying all plugins",
);
