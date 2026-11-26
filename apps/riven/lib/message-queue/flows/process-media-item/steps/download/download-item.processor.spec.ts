import { Movie, Show } from "@repo/util-plugin-sdk/dto/entities";

import { UnrecoverableError } from "bullmq";
import { Settings } from "luxon";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

import { downloadItemProcessor } from "./download-item.processor.ts";

import type { MainRunnerMachineIntake } from "#state-machines/main-runner/index.ts";

const it = baseIt
  .extend("spyOnSettingsNow", () => () => vi.spyOn(Settings, "now"))
  .extend(
    "createFindValidTorrentResult",
    () => (infoHash: string, matchedMediaItemId: string) => ({
      result: {
        torrentId: "1234",
        infoHash,
        provider: null,
        files: [
          {
            name: "Test Movie 2024 1080p.mkv",
            path: "/Test Movie 2024 1080p.mkv",
            size: 1024,
            link: "http://example.com/download",
            matchedMediaItemId,
            isCachedFile: false,
          },
        ],
      },
      plugin: "@repo/plugin-test",
    }),
  );

it('sends a "riven.media-item.download.success" event with the updated item and duration from request to download if the download result is valid', async ({
  spyOnSettingsNow,
  scrapedMovieContext: { scrapedMovie },
  createMockJob,
  mockSentryScope,
  services,
  createMockJobChildKey,
}) => {
  spyOnSettingsNow().mockReturnValue(10_000);

  const [{ infoHash: streamInfoHash } = {}] = await scrapedMovie.streams.load();

  const job = await createMockJob({ id: scrapedMovie.id }, { timestamp: 1000 });

  expect.assert(streamInfoHash);

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.find-valid-torrent")]: {
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
            matchedMediaItemId: scrapedMovie.id,
            isCachedFile: false,
          },
        ],
      },
      plugin: "@repo/plugin-test",
    },
  });

  const sendEvent = vi.fn<MainRunnerMachineIntake>();

  await downloadItemProcessor(
    {
      job,
      scope: mockSentryScope,
    },
    {
      sendEvent,
      services,
      plugins: new Map(),
    },
  );

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.success",
    item: expect.any(Movie),
    durationMs: 9000,
    downloader: "@repo/plugin-test",
    provider: null,
  });
});

it('sends a "riven.media-item.download.partial-success" event with the updated item if the download result is valid but does not contain all episodes', async ({
  createMockJob,
  scrapedShowContext: { scrapedShow },
  mockSentryScope,
  services,
  createMockJobChildKey,
}) => {
  const episodes = await scrapedShow.getEpisodes();

  expect.assert(episodes[0]);
  expect.assert(episodes[1]);

  const [{ infoHash: streamInfoHash } = {}] = await scrapedShow.streams.load();

  expect.assert(streamInfoHash);

  const job = await createMockJob({ id: scrapedShow.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.find-valid-torrent")]: {
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

  const sendEvent = vi.fn<MainRunnerMachineIntake>();

  await downloadItemProcessor(
    {
      job,
      scope: mockSentryScope,
    },
    {
      sendEvent,
      services,
      plugins: new Map(),
    },
  );

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.partial-success",
    item: expect.any(Show),
    downloader: "@repo/plugin-test",
  });
});

it('sends a "riven.media-item.download.error" event if no valid torrent is found', async ({
  createMockJob,
  scrapedMovieContext: { scrapedMovie },
  mockSentryScope,
  services,
}) => {
  const job = await createMockJob({ id: scrapedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});

  const sendEvent = vi.fn<MainRunnerMachineIntake>();

  await downloadItemProcessor(
    {
      job,
      scope: mockSentryScope,
    },
    {
      sendEvent,
      services,
      plugins: new Map(),
    },
  ).catch(() => undefined);

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.download.error",
    item: expect.any(Movie),
    error: expect.any(Error),
  });
});

it("sends the download error event and fails permanently when the results cannot be persisted", async ({
  createFindValidTorrentResult,
  completedMovieContext: {
    completedMovie,
    streams: [stream],
  },
  createMockJob,
  createMockJobChildKey,
  mockSentryScope,
  services,
}) => {
  expect.assert(stream);

  const job = await createMockJob({ id: completedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.find-valid-torrent")]:
      createFindValidTorrentResult(stream.infoHash, completedMovie.id),
  });

  const sendEvent = vi.fn<MainRunnerMachineIntake>();

  await expect(
    downloadItemProcessor(
      { job, scope: mockSentryScope },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow(
    new UnrecoverableError(
      `Failed to persist download results for ${completedMovie.fullTitle}: `,
    ).message,
  );

  expect(sendEvent).toHaveBeenCalledExactlyOnceWith(
    expect.objectContaining({
      type: "riven.media-item.download.error.incorrect-state",
      item: expect.objectContaining({ id: completedMovie.id }),
    }),
  );
});

it("rethrows unexpected errors whilst persisting the results", async ({
  createFindValidTorrentResult,
  scrapedMovieContext: { scrapedMovie },
  createMockJob,
  createMockJobChildKey,
  mockSentryScope,
  services,
}) => {
  const job = await createMockJob({ id: scrapedMovie.id });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    [createMockJobChildKey("download-item.find-valid-torrent")]:
      createFindValidTorrentResult(
        "0000000000000000000000000000000000000000",
        scrapedMovie.id,
      ),
  });

  const sendEvent = vi.fn<MainRunnerMachineIntake>();
  const rejection = downloadItemProcessor(
    { job, scope: mockSentryScope },
    { sendEvent, services, plugins: new Map() },
  );

  await expect(rejection).rejects.toThrow(
    `No media item found with ID ${scrapedMovie.id} and stream info hash 0000000000000000000000000000000000000000`,
  );
  await expect(rejection).rejects.not.toBeInstanceOf(UnrecoverableError);

  expect(sendEvent).not.toHaveBeenCalled();
});
