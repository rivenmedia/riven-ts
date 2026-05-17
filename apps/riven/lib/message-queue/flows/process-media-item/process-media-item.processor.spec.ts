import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { processMediaItemProcessor } from "./process-media-item.processor.ts";

import type { ValidPlugin } from "../../../types/plugins.ts";
import type { ValidationError } from "@mikro-orm/core";
import type { Job } from "bullmq";

vi.mock("./steps/scrape/enqueue-scrape-item.ts");
vi.mock("./steps/download/enqueue-download-item.ts");
vi.mock("../post-process-media-item/enqueue-post-process-media-item.ts");

const testPluginSymbol = Symbol.for("@repo/plugin-test");

function createTestPluginMap(hooks: Record<string, unknown> = {}) {
  const plugin: ValidPlugin = {
    status: "valid",
    config: {
      name: { description: "@repo/plugin-test" },
      hooks,
    } as never,
    dataSources: new Map() as never,
  };

  return new Map([[testPluginSymbol, plugin]]);
}

function mockUpdateData(job: Job) {
  return vi.spyOn(job, "updateData").mockImplementation(async (data) => {
    Object.assign(job.data, data);

    return Promise.resolve();
  });
}

it('enqueues item scraping if the step is "scrape"', async ({
  createMockJob,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const { enqueueScrapeItem } =
    await import("./steps/scrape/enqueue-scrape-item.ts");

  vi.mocked(enqueueScrapeItem).mockReturnValue({
    job: {} as never,
  } as never);

  const job = await createMockJob({
    step: "scrape" as const,
    mediaItem: {
      id: movie.id,
      type: movie.type,
      fullTitle: movie.fullTitle,
    },
    isRootItem: true,
  });

  mockUpdateData(job);
  vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
    ),
  ).rejects.toThrow("WaitingChildren");

  expect(enqueueScrapeItem).toHaveBeenCalledWith(
    expect.objectContaining({
      item: expect.objectContaining({ id: movie.id }),
      isRootItem: true,
    }),
  );
});

it("throws UnrecoverableError if the item has exhausted all scrape attempts", async ({
  createMockJob,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const { enqueueScrapeItem } =
    await import("./steps/scrape/enqueue-scrape-item.ts");

  vi.mocked(enqueueScrapeItem).mockReturnValue(null);

  const job = await createMockJob({
    step: "scrape" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
    ),
  ).rejects.toThrow("exhausted all scrape attempts");
});

it('enqueues item downloading if the step is "download"', async ({
  createMockJob,
  services,
  seeders: { seedScrapedMovie },
}) => {
  const { movie } = await seedScrapedMovie();

  const { enqueueDownloadItem } =
    await import("./steps/download/enqueue-download-item.ts");

  vi.mocked(enqueueDownloadItem).mockResolvedValue({
    job: {} as never,
  } as never);

  const job = await createMockJob({
    step: "download" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);
  vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
    ),
  ).rejects.toThrow("WaitingChildren");

  expect(enqueueDownloadItem).toHaveBeenCalledWith(
    expect.objectContaining({
      item: expect.objectContaining({ id: movie.id }),
    }),
  );
});

it("schedules a re-scrape when download validation has ignored dependencies", async ({
  createMockJob,
  services,
  seeders: { seedScrapedMovie },
}) => {
  const { movie } = await seedScrapedMovie();

  const job = await createMockJob({
    step: "validate-download" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 0,
    unprocessed: 0,
    ignored: 1,
  });

  vi.spyOn(job, "moveToDelayed").mockResolvedValue();

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
    ),
  ).rejects.toThrow(); // DelayedError

  // Step should be reset to "scrape" for re-attempt
  expect(job.data.step).toBe("scrape");
});

it("throws UnrecoverableError when validate-scrape has ignored dependencies for a root item", async ({
  createMockJob,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const job = await createMockJob({
    step: "validate-scrape" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);
  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 0,
    unprocessed: 0,
    ignored: 1,
  });

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: createTestPluginMap() },
    ),
  ).rejects.toThrow("failed to scrape after all attempts");
});

it("enqueues post-processing on completion if post-processing is required", async ({
  createMockJob,
  services,
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const { enqueuePostProcessMediaItem } =
    await import("../post-process-media-item/enqueue-post-process-media-item.ts");

  vi.mocked(enqueuePostProcessMediaItem).mockResolvedValue({} as never);

  const job = await createMockJob({
    step: "complete" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  const plugins = createTestPluginMap({
    "riven.media-item.subtitle.requested": vi.fn(),
  });

  await processMediaItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins },
  );

  expect(enqueuePostProcessMediaItem).toHaveBeenCalledWith(
    expect.objectContaining({ id: movie.id }),
  );
});

it("does not enqueue post-processing on completion if not required", async ({
  createMockJob,
  services,
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const { enqueuePostProcessMediaItem } =
    await import("../post-process-media-item/enqueue-post-process-media-item.ts");

  vi.mocked(enqueuePostProcessMediaItem).mockClear();

  const job = await createMockJob({
    step: "complete" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  await processMediaItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(enqueuePostProcessMediaItem).not.toHaveBeenCalled();
});

it("logs completion and checks show status for episode items", async ({
  createMockJob,
  services,
  seeders: { seedCompletedShow },
}) => {
  const { episodes } = await seedCompletedShow();
  const episode = episodes![0]!;

  const job = await createMockJob({
    step: "complete" as const,
    mediaItem: {
      id: episode.id,
      type: episode.type,
      fullTitle: episode.fullTitle,
    },
    isRootItem: false,
  });

  mockUpdateData(job);

  await processMediaItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(job.data.step).toBe("complete");
});

it("throws UnrecoverableError if item is not in a successful state on completion", async ({
  createMockJob,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const job = await createMockJob({
    step: "complete" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: new Map() },
    ),
  ).rejects.toThrow("did not complete successfully");
});

it("throws UnrecoverableError for non-root items when validate-scrape has ignored dependencies", async ({
  createMockJob,
  services,
  seeders: { seedIndexedMovie },
}) => {
  const { movie } = await seedIndexedMovie();

  const job = await createMockJob({
    step: "validate-scrape" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: false,
  });

  mockUpdateData(job);
  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 0,
    unprocessed: 0,
    ignored: 1,
  });

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: new Map() },
    ),
  ).rejects.toThrow("failed to scrape");
});

it("moves to complete step when validate-download has no ignored dependencies", async ({
  createMockJob,
  services,
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const { enqueuePostProcessMediaItem } =
    await import("../post-process-media-item/enqueue-post-process-media-item.ts");

  vi.mocked(enqueuePostProcessMediaItem).mockClear();

  const job = await createMockJob({
    step: "validate-download" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 1,
    unprocessed: 0,
    ignored: 0,
  });

  await processMediaItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(job.data.step).toBe("complete");
});

it("wraps ValidationError as UnrecoverableError", async ({
  createMockJob,
  services,
  seeders: { seedCompletedMovie },
}) => {
  const { movie } = await seedCompletedMovie();

  const job = await createMockJob({
    step: "complete" as const,
    mediaItem: { id: movie.id, type: movie.type, fullTitle: movie.fullTitle },
    isRootItem: true,
  });

  mockUpdateData(job);

  vi.spyOn(services.mediaItemService, "getMediaItem").mockRejectedValueOnce(
    Object.assign(new Error("Validation failed"), {
      constructor: { name: "ValidationError" },
    }) as ValidationError,
  );

  // Import the actual ValidationError to create a proper instance
  const { ValidationError: MikroValidationError } =
    await import("@mikro-orm/core");

  vi.spyOn(services.mediaItemService, "getMediaItem").mockReset();
  vi.spyOn(services.mediaItemService, "getMediaItem").mockRejectedValueOnce(
    new MikroValidationError("test validation error"),
  );

  await expect(
    processMediaItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins: new Map() },
    ),
  ).rejects.toThrow("test validation error");
});
