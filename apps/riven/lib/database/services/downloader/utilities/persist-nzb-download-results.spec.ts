import { Episode } from "@repo/util-plugin-sdk/dto/entities";

import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";

const NZB_RESULT = {
  altmountId: "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM",
  streamUrl:
    "http://usenet:usenet@altmount:8081/webdav/complete/Default/Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
  fileSize: 69347000342,
  originalFilename:
    "Inception.2010.4K.HDR.DV.2160p.BDRemux.Ita.Eng.x265-NAHOM.mkv",
} as const;

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
  expect(entry!.streamUrl).toBe(NZB_RESULT.streamUrl);
  expect(entry!.provider).toBe("altmount");
  expect(entry!.providerDownloadId).toBe(NZB_RESULT.altmountId);
  expect(Number(entry!.fileSize)).toBe(NZB_RESULT.fileSize);
  expect(entry!.originalFilename).toBe(NZB_RESULT.originalFilename);
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
    ...NZB_RESULT,
    altmountId: "The.Office.S01E01.1080p.x265-GROUP",
    originalFilename: "The.Office.S01E01.1080p.x265-GROUP.mkv",
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
