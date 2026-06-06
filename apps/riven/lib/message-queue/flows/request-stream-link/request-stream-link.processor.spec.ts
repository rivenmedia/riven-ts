import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { NotFoundError } from "@mikro-orm/core";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { ProcessMediaItemFlow } from "../process-media-item/process-media-item.schema.ts";
import { flow } from "../producer.ts";
import { enqueueRequestStreamLink } from "./enqueue-request-stream-link.ts";
import { requestStreamLinkProcessor } from "./request-stream-link.processor.ts";
import { RequestStreamLinkFlow } from "./request-stream-link.schema.ts";

it.beforeEach(({ createFlowWorker }) => {
  createFlowWorker(RequestStreamLinkFlow, requestStreamLinkProcessor);
});

it("saves the stream link to the media entry after receiving a valid response", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { mediaEntryService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: true,
        data: {
          link: "https://example.com/stream-link",
        },
      }),
  );

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("completed");
  });

  const { streamUrl } = await mediaEntryService.getMediaEntryById(
    mediaEntry.id,
    { fields: ["streamUrl"] },
  );

  expect(streamUrl).toBe("https://example.com/stream-link");
});

it("blacklists the stream if the response indicates a dead link", async ({
  em,
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { mediaItemService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: false,
        statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
      }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("failed");
  });

  await expect(
    em.findOneOrFail(BlacklistedStream, {
      stream: activeStream.infoHash,
      mediaItem: completedMovie,
      provider: mediaEntry.provider,
      plugin: mediaEntry.plugin,
    }),
  ).resolves.toBeInstanceOf(BlacklistedStream);

  const updatedMediaItem = await mediaItemService.getMediaItemById(
    completedMovie.id,
    { populate: ["blacklistedStreams"] },
  );

  expect(updatedMediaItem.blacklistedStreams).toHaveLength(1);
});

it("deletes the media entry if the response indicates a dead link", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { mediaEntryService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: false,
        statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
      }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("failed");
  });

  await expect(() =>
    mediaEntryService.getMediaEntryById(mediaEntry.id, {
      fields: ["streamUrl"],
    }),
  ).rejects.toThrow(NotFoundError);
});

it("does not blacklist the stream if the response indicates a non-fatal error", async ({
  em,
  completedMovieContext: { completedMovie },
  createPluginWorker,
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: false,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("failed");
  });

  const blacklistedStream = await em.findOne(BlacklistedStream, {
    stream: activeStream.infoHash,
  });

  expect(blacklistedStream).toBeNull();
});

it("adds a job to reprocess the movie if the item is a movie", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  createFlowWorker,
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  const mockProcessMediaItemProcessor = vi.fn();

  createFlowWorker(ProcessMediaItemFlow, mockProcessMediaItemProcessor);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: false,
        statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
      }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("failed");

    expect(mockProcessMediaItemProcessor).toHaveBeenCalled();
  });
});

it("adds a job to reprocess the lowest common denominator in the item's hierarchy if the item is show-like", async ({
  completedShowContext: { completedShow },
  createPluginWorker,
  createFlowWorker,
}) => {
  const [mediaEntry] = await completedShow.getMediaEntries();

  expect.assert(mediaEntry);

  const mockProcessMediaItemProcessor = vi.fn();
  const flowAddSpy = vi.spyOn(flow, "addBulk");

  createFlowWorker(ProcessMediaItemFlow, mockProcessMediaItemProcessor);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        success: false,
        statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
      }),
  );

  const { activeStream } = completedShow;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await vi.waitFor(async () => {
    expect.assert(job.id);

    expect(await job.getState()).toBe("failed");

    expect(flowAddSpy).toHaveBeenCalledWith([
      expect.objectContaining({
        data: expect.objectContaining({
          isRootItem: true,
          mediaItem: expect.objectContaining({
            id: completedShow.id,
          }),
          step: "scrape",
        }),
        queueName: "process-media-item",
      }),
    ]);
  }, 2000);
});
