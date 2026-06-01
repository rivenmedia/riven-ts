import {
  Episode,
  MediaEntry,
  MediaItem,
  Movie,
  Season,
} from "@repo/util-plugin-sdk/dto/entities";
import { DownloadKind } from "@repo/util-plugin-sdk/dto/enums/download-kind.enum";
import { parseFilePath } from "@repo/util-rank-torrent-name";

import { type EntityManager, NotFoundError, ref } from "@mikro-orm/core";
import assert from "node:assert";

import { logger } from "../../../../utilities/logger/logger.ts";

import type { UUID } from "node:crypto";

/** A single completed media file resolved by the altmount plugin over WebDAV. */
export interface NzbResolvedFile {
  streamUrl: string;
  fileSize: number;
  originalFilename: string;
}

/**
 * The completed-download details handed back by the altmount plugin's
 * `nzb-download.requested` response, threaded through the nzb-download flow.
 */
export interface NzbDownloadResult {
  /** Opaque altmount/SAB job id (nzo_id). */
  altmountId: string;
  /** Resolved file(s): one for a movie/episode, one per episode for a season pack. */
  files: NzbResolvedFile[];
}

// NZB downloads are produced exclusively by plugin-altmount in this codebase,
// so the provider/plugin identifiers are fixed. (If a second NZB downloader is
// ever added, thread these through the flow output like the torrent path's
// `processedBy`.)
const ALTMOUNT_PROVIDER = "altmount";
const ALTMOUNT_PLUGIN = "@repo/plugin-altmount";

function attachMediaEntry(
  em: EntityManager,
  item: Movie | Episode,
  file: NzbResolvedFile,
  altmountId: string,
) {
  item.filesystemEntries.add(
    em.create(MediaEntry, {
      fileSize: file.fileSize,
      originalFilename: file.originalFilename,
      mediaItem: ref(item),
      provider: ALTMOUNT_PROVIDER,
      providerDownloadId: altmountId,
      streamUrl: file.streamUrl,
      plugin: ALTMOUNT_PLUGIN,
    }),
  );
}

async function hasMediaEntry(item: Movie | Episode): Promise<boolean> {
  const entries = await item.filesystemEntries.loadItems();
  return entries.some((entry) => entry.type === "media");
}

/**
 * Persist a completed altmount NZB download.
 *
 * Mirrors the torrent-side {@link persistDownloadResults}: attaches a
 * `MediaEntry` (pointing at the altmount WebDAV `streamUrl`) to each affected
 * Movie/Episode. It deliberately does NOT set `state` — the
 * `MediaItemStateSubscriber` recomputes state on flush and promotes any
 * Movie/Episode with a `media` filesystem entry to `completed` (and propagates
 * Season/Show state from there). Creating the entry is what drives the item to
 * `completed`.
 *
 *  - Movie / Episode → one resolved file → one entry.
 *  - Season (pack)   → map each resolved file to its episode by parsing
 *    `SxxEyy` from the filename (no `matchedMediaItemId` like the torrent path,
 *    so we parse), and attach a per-episode entry.
 *
 * Idempotent: skips any Movie/Episode that already has a media entry.
 */
export async function persistNzbDownloadResults(
  em: EntityManager,
  id: UUID,
  result: NzbDownloadResult,
) {
  const item = await em.getRepository(MediaItem).findOne(id, {
    populate: ["filesystemEntries:ref"],
  });

  assert(item, new NotFoundError(`No media item found with ID ${id}`));

  if (item instanceof Movie || item instanceof Episode) {
    const [file] = result.files;
    assert(file, "NZB download result has no resolved file");

    if (!(await hasMediaEntry(item))) {
      attachMediaEntry(em, item, file, result.altmountId);
    }
  } else if (item instanceof Season) {
    // Pre-load the show so each episode entry's `_setPath` can build its VFS
    // path without a lazy load.
    await item.show.loadOrFail();
    const episodes = await item.episodes.loadItems();

    // Index episodes by "season:episode" so parsed filenames can find them.
    const byNumber = new Map<string, Episode>(
      episodes.map((episode) => [
        `${item.number.toString()}:${episode.number.toString()}`,
        episode,
      ]),
    );

    for (const file of result.files) {
      const parsed = parseFilePath(file.originalFilename);
      const episodeNumber = parsed.episodes[0];

      if (episodeNumber === undefined) {
        continue;
      }

      const seasonNumber = parsed.seasons[0] ?? item.number;
      const episode = byNumber.get(
        `${seasonNumber.toString()}:${episodeNumber.toString()}`,
      );

      if (!episode) {
        logger.debug(
          `Skipping NZB file ${file.originalFilename}: no matching episode in season ${item.number.toString()}`,
        );
        continue;
      }

      if (!(await hasMediaEntry(episode))) {
        attachMediaEntry(em, episode, file, result.altmountId);
      }
    }
  }

  // Record the download kind + opaque id for correlation/debugging. State is
  // intentionally left to the MediaItemStateSubscriber (see doc comment).
  item.downloadKind = DownloadKind.enum.nzb;
  item.downloadId = result.altmountId;

  return item;
}
