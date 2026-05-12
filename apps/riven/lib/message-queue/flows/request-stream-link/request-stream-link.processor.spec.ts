import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";

import { NotFoundError } from "@mikro-orm/core";
import { StatusCodes } from "http-status-codes";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { enqueueRequestStreamLink } from "./enqueue-request-stream-link.ts";
import { requestStreamLinkProcessor } from "./request-stream-link.processor.ts";
import { RequestStreamLinkFlow } from "./request-stream-link.schema.ts";

it.beforeAll(({ createFlowWorker }) => {
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
});

it("blacklists the stream if the response indicates a dead link", async ({
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

  const blacklistedStream = await em.findOneOrFail(BlacklistedStream, {
    stream: activeStream.infoHash,
  });

  expect(blacklistedStream.stream.infoHash).toBe(activeStream.infoHash);
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
});
