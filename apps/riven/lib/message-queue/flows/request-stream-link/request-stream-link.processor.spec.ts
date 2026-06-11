import { BlacklistedStream } from "@repo/util-plugin-sdk/dto/entities";
import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

import { NotFoundError } from "@mikro-orm/core";
import { DateTime } from "luxon";
import { expect, vi } from "vitest";

import { it } from "../../../__tests__/test-context.ts";
import { runSingleJob } from "../../utilities/run-single-job.ts";
import { ProcessMediaItemFlow } from "../process-media-item/process-media-item.schema.ts";
import { flow } from "../producer.ts";
import { enqueueRequestStreamLink } from "./enqueue-request-stream-link.ts";
import { requestStreamLinkProcessor } from "./request-stream-link.processor.ts";
import { RequestStreamLinkFlow } from "./request-stream-link.schema.ts";

it.beforeEach(({ createFlowWorker }) => {
  createFlowWorker(RequestStreamLinkFlow, requestStreamLinkProcessor);
});

it("returns the cached stream link for the media entry if one already exists", async ({
  completedMovieContext: { completedMovie },
  services: { streamService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  await streamService.saveStreamLink(
    mediaEntry.id,
    "https://example.com/stream-link",
    60,
  );

  expect.assert(mediaEntry);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await runSingleJob(job);

  const cachedLink = await streamService.getStreamLink(mediaEntry.id);

  expect(cachedLink).toBe("https://example.com/stream-link");
});

it("does not request a new stream link if the media entry has a pre-existing permalink", async ({
  em,
  createPluginWorker,
  completedMovieContext: { completedMovie },
  services: { streamService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  mediaEntry.streamPermalink = "https://example.com/existing-permalink";

  await em.persist(mediaEntry).flush();

  const streamLinkRequestedMock = vi.fn().mockResolvedValue({
    success: true,
    data: {
      link: "https://example.com/stream-link",
      isPermalink: true,
    },
  });

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    streamLinkRequestedMock,
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        state: "healthy",
        statusCode: 200,
      }),
  );

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  expect.assert(job.id);

  await runSingleJob(job);

  const { children } = await flow.getFlow({
    id: job.id,
    queueName: job.queueName,
  });

  expect(children).not.toEqual(
    expect.arrayContaining([
      {
        job: expect.objectContaining({
          queueQualifiedName: expect.stringContaining(
            "riven.media-item.stream-link.requested",
          ),
        }),
      },
    ]),
  );

  const cachedLink = await streamService.getStreamLink(mediaEntry.id);

  expect(cachedLink).toBe("https://example.com/existing-permalink");
});

it("saves the stream link to the media entry after receiving a healthy permalink", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { mediaEntryService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    vi.fn().mockResolvedValue({
      success: true,
      data: {
        link: "https://example.com/stream-link",
        isPermalink: true,
      },
    }),
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    vi.fn().mockResolvedValue({
      state: "healthy",
      statusCode: 200,
    }),
  );

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await runSingleJob(job);

  const { streamPermalink } = await mediaEntryService.getMediaEntryById(
    mediaEntry.id,
    { fields: ["streamPermalink"] },
  );

  expect(streamPermalink).toBe("https://example.com/stream-link");
});

it("saves the stream link to the cache after receiving a healthy link", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { streamService },
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
          isPermalink: true,
        },
      }),
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        state: "healthy",
        statusCode: 200,
      }),
  );

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await runSingleJob(job);

  const cachedLink = await streamService.getStreamLink(mediaEntry.id);

  expect(cachedLink).toBe("https://example.com/stream-link");
});

it("does not save the stream link to the media entry after receiving a healthy non-permalink", async ({
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
          isPermalink: false,
          expiresAt: DateTime.utc().plus({ hours: 3 }).toISO(),
        },
      }),
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    () =>
      Promise.resolve({
        state: "healthy",
        statusCode: 200,
      }),
  );

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await runSingleJob(job);

  const { streamPermalink } = await mediaEntryService.getMediaEntryById(
    mediaEntry.id,
    { fields: ["streamPermalink"] },
  );

  expect(streamPermalink).toBeNull();
});

it("blacklists the stream if the stream link response indicates a dead link", async ({
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
    vi.fn().mockResolvedValue({
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

  await expect(runSingleJob(job)).rejects.toThrow(/dead torrent detected/i);

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

it("blacklists the stream if the health check response indicates a dead link", async ({
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
    vi.fn().mockResolvedValue({
      success: true,
      data: {
        link: "https://example.com/stream-link",
        isPermalink: true,
      },
    }),
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    vi.fn().mockResolvedValue({
      state: "dead",
      statusCode: StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
    }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await expect(runSingleJob(job)).rejects.toThrow(/dead torrent detected/i);

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

it("attempts to refresh the link if the health check response indicates an expired link", async ({
  completedMovieContext: { completedMovie },
  createPluginWorker,
  services: { mediaEntryService },
}) => {
  const [mediaEntry] = await completedMovie.getMediaEntries();

  expect.assert(mediaEntry);

  createPluginWorker(
    "riven.media-item.stream-link.requested",
    mediaEntry.plugin,
    vi
      .fn()
      .mockResolvedValueOnce({
        success: true,
        data: {
          link: "https://example.com/expired-link",
          isPermalink: true,
        },
      })
      .mockResolvedValue({
        success: true,
        data: {
          link: "https://example.com/refreshed-link",
          isPermalink: true,
        },
      }),
  );

  createPluginWorker(
    "riven.media-item.stream-link.health-check.requested",
    mediaEntry.plugin,
    vi
      .fn()
      .mockResolvedValueOnce({
        state: "expired",
        statusCode: StatusCodes.BAD_REQUEST,
      })
      .mockResolvedValue({
        state: "healthy",
        statusCode: StatusCodes.OK,
      }),
  );

  const { activeStream } = completedMovie;

  expect.assert(activeStream);

  const { job } = await enqueueRequestStreamLink({
    mediaEntryId: mediaEntry.id,
    mediaItemTitle: mediaEntry.mediaItem.unwrap().fullTitle,
  });

  await runSingleJob(job);

  const { streamPermalink } = await mediaEntryService.getMediaEntryById(
    mediaEntry.id,
    { fields: ["streamPermalink"] },
  );

  expect(streamPermalink).toBe("https://example.com/refreshed-link");
});

it("deletes the media entry if the stream link response indicates a dead link", async ({
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

  await expect(runSingleJob(job)).rejects.toThrow(/dead torrent detected/i);

  await expect(() =>
    mediaEntryService.getMediaEntryById(mediaEntry.id, {
      fields: ["streamPermalink"],
    }),
  ).rejects.toThrow(NotFoundError);
});

it("does not blacklist the stream if the stream link response indicates a non-fatal error", async ({
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

  await expect(runSingleJob(job)).rejects.toThrow(
    /plugin failed to generate stream link/i,
  );

  const blacklistedStream = await em.findOne(BlacklistedStream, {
    stream: activeStream.infoHash,
  });

  expect(blacklistedStream).toBeNull();
});

it("adds a job to reprocess the movie if the item is a movie and its torrent is dead", async ({
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

  await expect(runSingleJob(job)).rejects.toThrow(/dead torrent detected/i);

  expect(mockProcessMediaItemProcessor).toHaveBeenCalled();
});

it("adds a job to reprocess the lowest common denominator in the item's hierarchy if the item is show-like and its torrent is dead", async ({
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

  await expect(runSingleJob(job)).rejects.toThrow(/dead torrent detected/i);

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
});
