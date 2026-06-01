import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

const MOVIE_FILE = {
  streamUrl:
    "http://usenet:usenet@altmount:8081/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
  fileSize: 69347000342,
  originalFilename:
    "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
};

const NZB_RESULT = {
  altmountId: "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
  files: [MOVIE_FILE],
};

const pad = (n: number) => n.toString().padStart(2, "0");

it("creates an altmount media entry and reaches completed for a movie", async ({
  indexedMovieContext: { indexedMovie },
  services: { downloaderService },
}) => {
  const updated = await downloaderService.persistNzbDownloadResult(
    indexedMovie.id,
    NZB_RESULT,
  );

  expect(updated.state).toBe("completed");

  const entries = await updated.getMediaEntries();
  expect(entries).toHaveLength(1);

  const [entry] = entries;
  expect(entry!.streamUrl).toBe(MOVIE_FILE.streamUrl);
  expect(entry!.provider).toBe("altmount");
  expect(entry!.providerDownloadId).toBe(NZB_RESULT.altmountId);
  expect(Number(entry!.fileSize)).toBe(MOVIE_FILE.fileSize);
  expect(entry!.originalFilename).toBe(MOVIE_FILE.originalFilename);
});

it("records the nzb download kind and id on the item", async ({
  indexedMovieContext: { indexedMovie },
  services: { downloaderService },
}) => {
  const updated = await downloaderService.persistNzbDownloadResult(
    indexedMovie.id,
    NZB_RESULT,
  );

  expect(updated.downloadKind).toBe("nzb");
  expect(updated.downloadId).toBe(NZB_RESULT.altmountId);
});

it("is idempotent — does not create a duplicate media entry on re-run", async ({
  indexedMovieContext: { indexedMovie },
  services: { downloaderService },
}) => {
  await downloaderService.persistNzbDownloadResult(indexedMovie.id, NZB_RESULT);
  const second = await downloaderService.persistNzbDownloadResult(
    indexedMovie.id,
    NZB_RESULT,
  );

  const entries = await second.getMediaEntries();
  expect(entries).toHaveLength(1);
});

it("creates a media entry and reaches completed for an episode", async ({
  scrapedShowContext: {
    episodes: [episode],
  },
  orm,
  services: { downloaderService },
}) => {
  expect.assert(episode);

  await downloaderService.persistNzbDownloadResult(episode.id, {
    altmountId: "The.Office.S01E01.1080p.x265-GROUP",
    files: [
      {
        ...MOVIE_FILE,
        originalFilename: "The.Office.S01E01.1080p.x265-GROUP.mkv",
      },
    ],
  });

  // Re-fetch from a fresh fork — this is what the processor does via
  // getMediaItemById. (The in-memory entity returned by the service can read
  // back as `indexed`: when the parent Season recomputes, its
  // `episodes.loadItems()` refreshes the episode's in-memory `.state` from the
  // not-yet-committed row, even though the episode's own changeset already
  // persisted `completed`. The committed DB row is correct.)
  const fresh = await orm.em
    .fork()
    .findOneOrFail(
      Episode,
      { id: episode.id },
      { populate: ["filesystemEntries"] },
    );

  expect(fresh.state).toBe("completed");
  const entries = await fresh.getMediaEntries();
  expect(entries).toHaveLength(1);
});

it("maps a season pack to its episodes (parsed SxxEyy) and completes them", async ({
  scrapedShowContext: {
    seasons: [season],
  },
  orm,
  services: { downloaderService },
}) => {
  expect.assert(season);

  const seasonEpisodes = (await season.episodes.loadItems())
    .sort((a, b) => a.number - b.number)
    .slice(0, 2);
  expect(seasonEpisodes.length).toBe(2);

  const files = seasonEpisodes.map((ep) => ({
    streamUrl: `http://usenet:usenet@altmount:8081/webdav/complete/Default/Show.S${pad(season.number)}-GRP/Show.S${pad(season.number)}E${pad(ep.number)}-GRP.mkv`,
    fileSize: 1_500_000_000,
    originalFilename: `Show.S${pad(season.number)}E${pad(ep.number)}-GRP.mkv`,
  }));

  await downloaderService.persistNzbDownloadResult(season.id, {
    altmountId: `Show.S${pad(season.number)}-GRP`,
    files,
  });

  for (const ep of seasonEpisodes) {
    const fresh = await orm.em
      .fork()
      .findOneOrFail(
        Episode,
        { id: ep.id },
        { populate: ["filesystemEntries"] },
      );
    expect(fresh.state).toBe("completed");
    expect(await fresh.getMediaEntries()).toHaveLength(1);
  }
});
