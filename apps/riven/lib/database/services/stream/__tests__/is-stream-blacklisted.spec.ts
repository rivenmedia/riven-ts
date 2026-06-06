import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("returns true if the stream is blacklisted for the media item/plugin/provider combination", async ({
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

  const isBlacklisted = await streamService.isStreamBlacklisted({
    mediaItem: completedMovie,
    stream: stream.infoHash,
    plugin: "test-plugin",
    provider: "test-provider",
  });

  expect(isBlacklisted).toBe(true);
});

it("returns false if the stream is not blacklisted for the media item/plugin/provider combination", async ({
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

  const isBlacklisted = await streamService.isStreamBlacklisted({
    mediaItem: completedMovie,
    stream: stream.infoHash,
    plugin: "another-plugin",
    provider: "another-provider",
  });

  expect(isBlacklisted).toBe(false);
});
