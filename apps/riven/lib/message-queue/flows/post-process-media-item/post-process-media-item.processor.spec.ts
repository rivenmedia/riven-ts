import { randomUUID } from "node:crypto";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { postProcessItemProcessor } from "./post-process-media-item.processor.ts";

import type { ValidPlugin } from "../../../types/plugins.ts";

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

const mediaItem = {
  id: randomUUID(),
  type: "movie" as const,
  fullTitle: "Test Movie (2024)",
};

it("completes without enqueuing subtitles when no subtitle plugins are available", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "post-process" as const,
    mediaItem,
  });

  vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(false);

  const updateDataSpy = vi
    .spyOn(job, "updateData")
    .mockImplementation(async (data) => {
      Object.assign(job.data, data);
    });

  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 0,
    unprocessed: 0,
  });

  await postProcessItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  // Moves through post-process → validate-post-process → complete
  expect(updateDataSpy).toHaveBeenCalled();
});

it("enqueues subtitle requests when subtitle plugins are available", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "post-process" as const,
    mediaItem,
  });

  vi.spyOn(job, "moveToWaitingChildren").mockResolvedValue(true);

  vi.spyOn(
    services.subtitlesService,
    "getItemsForSubtitlesProcessing",
  ).mockResolvedValue([]);

  const plugins = createTestPluginMap({
    "riven.media-item.subtitle.requested": vi.fn(),
  });

  await expect(
    postProcessItemProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins },
    ),
  ).rejects.toThrow("WaitingChildren");
});

it("transitions through validate-post-process to complete", async ({
  createMockJob,
  services,
}) => {
  const job = await createMockJob({
    step: "validate-post-process" as const,
    mediaItem,
  });

  const updateDataSpy = vi
    .spyOn(job, "updateData")
    .mockImplementation(async (data) => {
      Object.assign(job.data, data);
    });
  vi.spyOn(job, "getDependenciesCount").mockResolvedValue({
    processed: 1,
    unprocessed: 0,
    ignored: 0,
  });

  await postProcessItemProcessor(
    { job, scope: vi.fn() as never, token: "test-token" },
    { sendEvent: vi.fn(), services, plugins: new Map() },
  );

  expect(updateDataSpy).toHaveBeenCalledWith(
    expect.objectContaining({ step: "complete" }),
  );
});
