import {
  MediaItem,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities";
import { DownloadKind } from "@repo/util-plugin-sdk/dto/enums/download-kind.enum";

import { ValidationError } from "@mikro-orm/core";
import {
  CreateRequestContext,
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import chalk from "chalk";

import { BaseService } from "../core/base-service.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

import type { ValidTorrent } from "../../../message-queue/flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { UUID } from "node:crypto";

export class DownloaderService extends BaseService {
  @CreateRequestContext()
  async getItemToDownload(id: UUID) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail(id);

    const processableStates: MediaItemState[] = [
      "scraped",
      "ongoing",
      "partially_completed",
    ];

    if (!processableStates.includes(item.state)) {
      throw new ValidationError(
        `${chalk.bold(item.fullTitle)} is ${chalk.bold(item.state)} and cannot be downloaded`,
        item,
      );
    }

    return item;
  }

  @CreateRequestContext()
  @Transactional()
  async downloadItem(id: UUID, torrent: ValidTorrent, processedBy: string) {
    return persistDownloadResults(this.em, id, torrent, processedBy);
  }

  @EnsureRequestContext()
  async getFanOutDownloadItems(id: UUID) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail(id);

    if (item instanceof Show) {
      return item.getIncompleteItems();
    }

    if (item instanceof Season) {
      return item.episodes.matching({
        orderBy: { number: "asc" },
        where: { state: { $in: ["ongoing", "indexed", "scraped"] } },
      });
    }

    return [];
  }

  @CreateRequestContext()
  async findMatchingStreams(infoHashes: string[]) {
    return this.em.getRepository(Stream).find({
      infoHash: {
        $in: infoHashes,
      },
    });
  }

  /**
   * Marks a media item as having been dispatched to an NZB download client.
   *
   * Sets:
   *   - `state`        → "downloaded"
   *   - `downloadKind` → "nzb"
   *   - `downloadId`   → `altmountId` returned by the plugin
   *
   * Called from the `validate-nzb-download` step of the process-media-item
   * processor once the nzb-download-item flow step has confirmed that the
   * altmount plugin accepted the NZB.
   *
   * Note: no explicit `em.flush()` here. `@Transactional()` commits the
   * UnitOfWork on successful return — same pattern as the torrent-side
   * `downloadItem` (which delegates to `persistDownloadResults` and also
   * never calls `em.flush()` directly). A thrown error rolls back.
   */
  @CreateRequestContext()
  @Transactional()
  async persistNzbDownloadResult(id: UUID, altmountId: string) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail(id);

    item.state = "downloaded";
    item.downloadKind = DownloadKind.enum.nzb;
    item.downloadId = altmountId;

    return item;
  }
}
