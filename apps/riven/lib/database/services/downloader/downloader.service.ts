import { MediaItem } from "@repo/util-plugin-sdk/dto/entities";

import {
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

import type { ValidTorrent } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { UUID } from "node:crypto";

export class DownloaderService extends BaseService {
  @EnsureRequestContext()
  @Transactional()
  async downloadItem(id: UUID, torrent: ValidTorrent, processedBy: string) {
    return persistDownloadResults(this.em, id, torrent, processedBy);
  }

  @EnsureRequestContext()
  async getItemToDownload(mediaItemId: UUID) {
    return this.em.getRepository(MediaItem).findOne({
      id: mediaItemId,
      state: {
        $in: ["scraped", "ongoing", "partially_completed"],
      },
    });
  }
}
