import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { findCommonBlacklistItems } from "./find-common-blacklist-items.ts";

it("returns an array of all media items that share the same active stream info hash, plugin, and provider", async ({
  em,
  seeders: { seedCompletedShow },
}) => {
  const mediaItems = await seedCompletedShow(2);
  const [{ show, episodes, seasons }] = mediaItems;

  expect.assert(seasons);
  expect.assert(show.activeStream);
  expect.assert(episodes?.[0]);

  const [mediaEntry] = await episodes[0].getMediaEntries();

  expect.assert(mediaEntry);

  em.persist(show).assign(show, {
    activeStream: show.activeStream,
  });

  for (const season of seasons) {
    em.persist(season).assign(season, {
      activeStream: show.activeStream,
    });

    for (const episode of season.episodes) {
      em.persist(episode).assign(episode, {
        activeStream: show.activeStream,
      });

      em.persist(mediaEntry).assign(mediaEntry, {
        plugin: mediaEntry.plugin,
        provider: mediaEntry.provider,
      });
    }
  }

  await em.flush();

  const items = await findCommonBlacklistItems(
    em,
    show.id,
    show.activeStream.infoHash,
    mediaEntry.plugin,
    mediaEntry.provider,
  );

  expect(items).toHaveLength(1 + seasons.length + episodes.length);
  expect(items).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ id: show.id }),
      ...seasons.map((season) => expect.objectContaining({ id: season.id })),
      ...episodes.map((episode) => expect.objectContaining({ id: episode.id })),
    ]),
  );
});

it("does not return items with a different active stream info hash, plugin, or provider", async ({
  em,
  completedMovieContext: { completedMovie: completedMovie },
}) => {
  expect.assert(completedMovie.activeStream);

  const items = await findCommonBlacklistItems(
    em,
    completedMovie.id,
    completedMovie.activeStream.infoHash,
    "different-plugin",
    "different-provider",
  );

  expect(items).toEqual([expect.objectContaining({ id: completedMovie.id })]);
});
