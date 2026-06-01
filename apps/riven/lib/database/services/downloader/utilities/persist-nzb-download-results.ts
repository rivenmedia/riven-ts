import {
  Episode,
  MediaEntry,
  MediaItem,
  Movie,
} from "@repo/util-plugin-sdk/dto/entities";
import { DownloadKind } from "@repo/util-plugin-sdk/dto/enums/download-kind.enum";

import { type EntityManager, NotFoundError, ref } from "@mikro-orm/core";
import assert from "node:assert";

import type { UUID } from "node:crypto";

/**
 * The completed-download details handed back by the altmount plugin's
 * `nzb-download.requested` response, threaded through the nzb-download flow.
 */
export interface NzbDownloadResult {
  /** Opaque altmount/SAB job id (nzo_id). */
  altmountId: string;
  /** WebDAV URL the file streams from, with credentials embedded as userinfo. */
  streamUrl: string;
  /** Size of the completed media file in bytes. */
  fileSize: number;
  /** Filename of the completed media file. */
  originalFilename: string;
}

// NZB downloads are produced exclusively by plugin-altmount in this codebase,
// so the provider/plugin identifiers are fixed. (If a second NZB downloader is
// ever added, thread these through the flow output like the torrent path's
// `processedBy`.)
const ALTMOUNT_PROVIDER = "altmount";
const ALTMOUNT_PLUGIN = "@repo/plugin-altmount";

/**
 * Persist a completed altmount NZB download.
 *
 * Mirrors the torrent-side {@link persistDownloadResults}: for a Movie or
 * Episode it attaches a `MediaEntry` pointing at the altmount WebDAV
 * `streamUrl`. It deliberately does NOT set `state` — the
 * `MediaItemStateSubscriber` recomputes state on flush and promotes any
 * Movie/Episode that has a `media` filesystem entry to `completed` (and
 * propagates Season/Show state from there). Creating the entry is therefore
 * what drives the item to `completed`, exactly as the torrent path does.
 *
 * Idempotent: if the item already has a media entry (e.g. a retried flow), no
 * duplicate is created.
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
    const existingEntries = await item.filesystemEntries.loadItems();
    const hasMediaEntry = existingEntries.some(
      (entry) => entry.type === "media",
    );

    if (!hasMediaEntry) {
      item.filesystemEntries.add(
        em.create(MediaEntry, {
          fileSize: result.fileSize,
          originalFilename: result.originalFilename,
          mediaItem: ref(item),
          provider: ALTMOUNT_PROVIDER,
          providerDownloadId: result.altmountId,
          streamUrl: result.streamUrl,
          plugin: ALTMOUNT_PLUGIN,
        }),
      );
    }
  }

  // Record the download kind + opaque id for correlation/debugging. State is
  // intentionally left to the MediaItemStateSubscriber (see doc comment).
  item.downloadKind = DownloadKind.enum.nzb;
  item.downloadId = result.altmountId;

  return item;
}
