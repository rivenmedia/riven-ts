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

// Episode / season-pack support is deferred (movies-first for v1). The util
// already attaches a MediaEntry to a standalone Episode, but the
// MediaItemStateSubscriber does not promote it to "completed" in the same
// flush: an Episode MediaEntry's `_setPath` @BeforeCreate loads season.show,
// which disturbs the collection so the subscriber's `loadItems()` re-queries
// and misses the not-yet-committed entry. (The torrent path never exercises a
// standalone episode — episodes are only handled via the show fan-out.)
// Tracked as a follow-up; resolving it likely means seeding the parent state
// recompute after the entry is flushed.
it.todo("creates a media entry and reaches completed for an episode");
