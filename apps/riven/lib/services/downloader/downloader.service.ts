import {
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { BaseService } from "../base-service.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

import type { ValidTorrent } from "../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { UUID } from "node:crypto";

export class DownloaderService extends BaseService {
  @EnsureRequestContext()
  @Transactional()
  async downloadItem(id: UUID, torrent: ValidTorrent, processedBy: string) {
    return persistDownloadResults(this.em, id, torrent, processedBy);
  }
}
