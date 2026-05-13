import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError } from "@mikro-orm/core";
import { StatusCodes } from "http-status-codes";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { ProcessMediaItemFlow } from "../process-media-item/process-media-item.schema.ts";
import { enqueueRequestStreamLink } from "./enqueue-request-stream-link.ts";
import { requestStreamLinkProcessor } from "./request-stream-link.processor.ts";
import { RequestStreamLinkFlow } from "./request-stream-link.schema.ts";

it.beforeAll(({ createFlowWorker }) => {
  createFlowWorker(RequestStreamLinkFlow, requestStreamLinkProcessor);
});

it.concurrent(
  "saves the stream link to the media entry after receiving a valid response",
  async ({
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
          link: "https://example.com/stream-link",
          statusCode: StatusCodes.OK,
        }),
    );

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      expect(await job.getState()).toBe("completed");
    });

    const { streamUrl } = await mediaEntryService.getMediaEntry(mediaEntry.id, {
      fields: ["streamUrl"],
    });

    expect(streamUrl).toBe("https://example.com/stream-link");
  },
);

it.concurrent(
  "blacklists the stream if the response indicates a dead link",
  async ({
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
          link: null,
          statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
        }),
    );

    const activeStream = completedMovie.activeStream;

    expect.assert(activeStream);

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      expect(await job.getState()).toBe("failed");
    });

    expect(() =>
      em.findOneOrFail(BlacklistedStream, {
        stream: activeStream.infoHash,
        mediaItem: completedMovie,
        provider: mediaEntry.provider,
        plugin: mediaEntry.plugin,
      }),
    ).not.toThrow();

    const updatedMediaItem = await mediaItemService.getMediaItem(
      completedMovie.id,
      { populate: ["blacklistedStreams"] },
    );

    expect(updatedMediaItem.blacklistedStreams).toHaveLength(1);
  },
);

it.concurrent(
  "deletes the media entry if the response indicates a dead link",
  async ({
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
          link: null,
          statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
        }),
    );

    const activeStream = completedMovie.activeStream;

    expect.assert(activeStream);

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      expect(await job.getState()).toBe("failed");
    });

    await expect(() =>
      mediaEntryService.getMediaEntry(mediaEntry.id, {
        fields: ["streamUrl"],
      }),
    ).rejects.toThrow(NotFoundError);
  },
);

it.concurrent(
  "does not blacklist the stream if the response indicates a non-fatal error",
  async ({
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
          link: null,
          statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        }),
    );

    const activeStream = completedMovie.activeStream;

    expect.assert(activeStream);

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      expect(await job.getState()).toBe("failed");
    });

    const blacklistedStream = await em.findOne(BlacklistedStream, {
      stream: activeStream.infoHash,
    });

    expect(blacklistedStream).toBeNull();
  },
);

it.concurrent(
  "adds a job to reprocess the media item if the stream was blacklisted",
  async ({
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
          link: null,
          statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
        }),
    );

    const activeStream = completedMovie.activeStream;

    expect.assert(activeStream);

    const { job } = await enqueueRequestStreamLink({
      mediaEntry,
    });

    await vi.waitFor(async () => {
      expect.assert(job.id);

      expect(await job.getState()).toBe("failed");

      expect(mockProcessMediaItemProcessor).toHaveBeenCalled();
    });
  },
);
