import { UniqueConstraintViolationException } from "@mikro-orm/core";
import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("creates a BlacklistedStream for the given infohash/provider/plugin combination", async ({
  services: { streamService },
  completedMovieContext: {
    completedMovie: completedMovie,
    streams: [, stream],
  },
}) => {
  expect.assert(stream);

  await streamService.blacklistStreamByInfoHash(
    completedMovie.id,
    stream.infoHash,
    "test-plugin",
    "test-provider",
  );

  const updatedBlacklistedStreams =
    await completedMovie.blacklistedStreams.loadItems({ refresh: true });

  expect(updatedBlacklistedStreams).toHaveLength(1);

  expect.assert(updatedBlacklistedStreams[0]);

  expect(updatedBlacklistedStreams[0].stream.infoHash).toBe(stream.infoHash);

  expect(updatedBlacklistedStreams[0].plugin).toBe("test-plugin");
  expect(updatedBlacklistedStreams[0].provider).toBe("test-provider");
});

it("allows provider to be null when creating the BlacklistedStream record", async ({
  services: { streamService },
  completedMovieContext: {
    completedMovie,
    streams: [stream],
  },
}) => {
  expect.assert(stream);

  await streamService.blacklistStreamByInfoHash(
    completedMovie.id,
    stream.infoHash,
    "test-plugin",
    null,
  );

  const updatedBlacklistedStreams =
    await completedMovie.blacklistedStreams.loadItems({ refresh: true });

  expect(updatedBlacklistedStreams).toHaveLength(1);

  expect.assert(updatedBlacklistedStreams[0]);

  expect(updatedBlacklistedStreams[0].stream.infoHash).toBe(stream.infoHash);

  expect(updatedBlacklistedStreams[0].plugin).toBe("test-plugin");
  expect(updatedBlacklistedStreams[0].provider).toBe(null);
});

it("rejects duplicate blacklisted streams for the same media item", async ({
  em,
  services: { streamService },
  completedMovieContext: {
    completedMovie,
    streams: [stream],
  },
}) => {
  expect.assert(stream);

  await streamService.blacklistStreamByInfoHash(
    completedMovie.id,
    stream.infoHash,
    "test-plugin",
    "test-provider",
  );

  await em.refresh(completedMovie);

  em.persist(completedMovie).assign(completedMovie, {
    activeStream: stream,
  });

  await em.flush();

  await expect(
    streamService.blacklistStreamByInfoHash(
      completedMovie.id,
      stream.infoHash,
      "test-plugin",
      "test-provider",
    ),
  ).rejects.toThrow(UniqueConstraintViolationException);
});

it("does not reject duplicate info hashes for different plugins", async ({
  em,
  services: { streamService },
  completedMovieContext: {
    completedMovie,
    streams: [stream],
  },
}) => {
  expect.assert(stream);

  await streamService.blacklistStreamByInfoHash(
    completedMovie.id,
    stream.infoHash,
    "test-plugin",
    "test-provider",
  );

  em.assign(completedMovie, {
    activeStream: stream,
  });

  await expect(
    streamService.blacklistStreamByInfoHash(
      completedMovie.id,
      stream.infoHash,
      "different-plugin",
      "test-provider",
    ),
  ).resolves.not.toThrow();
});

it("does not reject duplicate info hashes for different providers within the same plugin", async ({
  em,
  services: { streamService },
  completedMovieContext: {
    completedMovie,
    streams: [stream],
  },
}) => {
  expect.assert(stream);

  await streamService.blacklistActiveStream({
    mediaItem: completedMovie,
    provider: "test-provider",
    plugin: "test-plugin",
  });

  em.assign(completedMovie, {
    activeStream: stream,
  });

  await expect(
    streamService.blacklistActiveStream({
      mediaItem: completedMovie,
      provider: "different-provider",
      plugin: "test-plugin",
    }),
  ).resolves.not.toThrow();
});

it("does not reject different info hashes for the same plugin", async ({
  em,
  services: { streamService },
  completedMovieContext: {
    completedMovie,
    streams: [firstStream, secondStream],
  },
}) => {
  expect.assert(firstStream);
  expect.assert(secondStream);

  await streamService.blacklistActiveStream({
    mediaItem: completedMovie,
    provider: "test-provider",
    plugin: "test-plugin",
  });

  em.assign(completedMovie, {
    activeStream: secondStream,
  });

  await expect(
    streamService.blacklistActiveStream({
      mediaItem: completedMovie,
      provider: "test-provider",
      plugin: "test-plugin",
    }),
  ).resolves.not.toThrow();
});
