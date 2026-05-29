import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

it("blacklists a stream for a media item", async ({
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

  const updatedBlacklistedStreams =
    await completedMovie.blacklistedStreams.loadItems({ refresh: true });

  expect(updatedBlacklistedStreams).toHaveLength(1);

  expect.assert(updatedBlacklistedStreams[0]);

  expect(updatedBlacklistedStreams[0].stream.infoHash).toBe(stream.infoHash);

  expect(updatedBlacklistedStreams[0].plugin).toBe("test-plugin");
  expect(updatedBlacklistedStreams[0].provider).toBe("test-provider");
});

it("clears the active stream for the media item", async ({
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

  await em.refreshOrFail(completedMovie, { populate: ["activeStream"] });

  expect(completedMovie.activeStream).toBeNull();
});

it('resets the media item state to "indexed" when blacklisting an active stream', async ({
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

  await em.refreshOrFail(completedMovie);

  expect(completedMovie.state).toBe("indexed");
});
