import { Movie } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemIndexError } from "@repo/util-plugin-sdk/schemas/events/media-item.index.error.event";
import { MediaItemIndexErrorIncorrectState } from "@repo/util-plugin-sdk/schemas/events/media-item.index.incorrect-state.event";

import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { flow } from "../producer.ts";
import { processItemRequestProcessor } from "./process-item-request.processor.ts";

import type { ValidPlugin } from "../../../types/plugins.ts";

const testPluginSymbol = Symbol.for("@repo/plugin-test");

function createTestPluginMap(events: string[] = []) {
  const hooks: Record<string, unknown> = {};

  for (const event of events) {
    hooks[event] = vi.fn();
  }

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

it('enqueues indexer plugin jobs when step is "request"', async ({
  createMockJob,
  services,
  services: { itemRequestService },
}) => {
  const { item } = await itemRequestService.requestMovie({
    imdbId: "tt7654321",
  });

  const job = await createMockJob({
    itemRequestId: item.id,
    step: "request" as const,
  });

  const moveToWaitingChildrenSpy = vi
    .spyOn(job, "moveToWaitingChildren")
    .mockResolvedValue(true);

  const flowAddBulkSpy = vi.spyOn(flow, "addBulk").mockResolvedValue([]);

  const plugins = createTestPluginMap([
    "riven.media-item.index.requested.movie",
  ]);

  await expect(
    processItemRequestProcessor(
      { job, scope: vi.fn() as never, token: "test-token" },
      { sendEvent: vi.fn(), services, plugins },
    ),
  ).rejects.toThrow("WaitingChildren");

  expect(flowAddBulkSpy).toHaveBeenCalledWith(
    expect.arrayContaining([
      expect.objectContaining({
        queueName: expect.stringContaining("plugin-test"),
      }),
    ]),
  );

  expect(moveToWaitingChildrenSpy).toHaveBeenCalled();
});

it('delays the job when no children return data in "process" step', async ({
  createMockJob,
  services,
  services: { itemRequestService },
}) => {
  const { item } = await itemRequestService.requestMovie({
    imdbId: "tt8888888",
  });

  const job = await createMockJob({
    itemRequestId: item.id,
    step: "process" as const,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({});
  vi.spyOn(job, "moveToDelayed").mockResolvedValue();

  await expect(
    processItemRequestProcessor(
      { job, scope: vi.fn() as never },
      { sendEvent: vi.fn(), services, plugins: new Map() },
    ),
  ).rejects.toThrow("Unable to index");
});

it('indexes the merged item data and sends a success event in "process" step', async ({
  createMockJob,
  factories,
  em,
  services,
  services: { indexerService },
}) => {
  const itemRequest = await factories.movieItemRequestFactory.createOne({
    state: "requested",
    imdbId: "tt9999999",
  });

  await em.flush();

  const job = await createMockJob({
    itemRequestId: itemRequest.id,
    step: "process" as const,
  });

  const fakeMovie = new Movie();
  fakeMovie.title = "Test Movie";

  vi.spyOn(indexerService, "indexItem").mockResolvedValue(fakeMovie);

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      item: {
        id: itemRequest.id,
        type: "movie",
        imdbId: "tt9999999",
        title: "Test Movie",
        year: 2024,
        genres: ["Action"],
        country: "US",
        rating: 7.5,
        aliases: null,
        posterUrl: null,
        language: "en",
        releaseDate: null,
        contentRating: null,
        runtime: 120,
      },
    },
  });

  const sendEvent = vi.fn();

  await processItemRequestProcessor(
    { job, scope: vi.fn() as never },
    { sendEvent, services, plugins: new Map() },
  );

  expect(indexerService.indexItem).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "movie",
      imdbId: "tt9999999",
    }),
  );

  expect(sendEvent).toHaveBeenCalledWith({
    type: "riven.media-item.index.success",
    item: fakeMovie,
  });
});

it("throws an UnrecoverableError when indexItem fails with MediaItemIndexError", async ({
  createMockJob,
  services,
  services: { itemRequestService, indexerService },
}) => {
  const { item } = await itemRequestService.requestMovie({
    imdbId: "tt1111111",
  });

  const job = await createMockJob({
    itemRequestId: item.id,
    step: "process" as const,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      item: {
        type: "movie",
        imdbId: "tt1111111",
        title: "Test Movie",
        year: 2024,
      },
    },
  });

  vi.spyOn(indexerService, "indexItem").mockRejectedValue(
    new MediaItemIndexError({
      item: { imdbId: "tt1111111" } as never,
      error: "Failed to index",
    }),
  );

  const sendEvent = vi.fn();

  await expect(
    processItemRequestProcessor(
      { job, scope: vi.fn() as never },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow("Failed to persist indexer data");

  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.media-item.index.error",
    }),
  );
});

it("throws an UnrecoverableError when indexItem fails with MediaItemIndexErrorIncorrectState", async ({
  createMockJob,
  services,
  services: { itemRequestService, indexerService },
}) => {
  const { item } = await itemRequestService.requestMovie({
    imdbId: "tt2222222",
  });

  const job = await createMockJob({
    itemRequestId: item.id,
    step: "process" as const,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      item: {
        type: "movie",
        imdbId: "tt2222222",
        title: "Test Movie",
        year: 2024,
      },
    },
  });

  vi.spyOn(indexerService, "indexItem").mockRejectedValue(
    new MediaItemIndexErrorIncorrectState({
      item: { imdbId: "tt2222222" } as never,
    }),
  );

  const sendEvent = vi.fn();

  await expect(
    processItemRequestProcessor(
      { job, scope: vi.fn() as never },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow("Failed to persist indexer data");

  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven.media-item.index.error.incorrect-state",
    }),
  );
});

it("rethrows generic errors from indexItem without wrapping", async ({
  createMockJob,
  services,
  services: { itemRequestService, indexerService },
}) => {
  const { item } = await itemRequestService.requestMovie({
    imdbId: "tt3333333",
  });

  const job = await createMockJob({
    itemRequestId: item.id,
    step: "process" as const,
  });

  vi.spyOn(job, "getChildrenValues").mockResolvedValue({
    "plugin[@repo/plugin-test]": {
      item: {
        type: "movie",
        imdbId: "tt3333333",
        title: "Test Movie",
        year: 2024,
      },
    },
  });

  const genericError = new Error("Something unexpected happened");
  vi.spyOn(indexerService, "indexItem").mockRejectedValue(genericError);

  const sendEvent = vi.fn();

  await expect(
    processItemRequestProcessor(
      { job, scope: vi.fn() as never },
      { sendEvent, services, plugins: new Map() },
    ),
  ).rejects.toThrow("Something unexpected happened");

  expect(sendEvent).not.toHaveBeenCalled();
});
