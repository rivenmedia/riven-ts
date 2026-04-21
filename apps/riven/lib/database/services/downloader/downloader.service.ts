import { MediaItem, Season, Show } from "@repo/util-plugin-sdk/dto/entities";

import { ValidationError } from "@mikro-orm/core";
import {
  EnsureRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";
import chalk from "chalk";

import { BaseService } from "../core/base-service.ts";
import { persistDownloadResults } from "./utilities/persist-download-results.ts";

import type { ValidTorrent } from "../../../message-queue/flows/download-item/steps/find-valid-torrent/find-valid-torrent.schema.ts";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { UUID } from "node:crypto";

export class DownloaderService extends BaseService {
  @EnsureRequestContext()
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

  @EnsureRequestContext()
  @Transactional()
  async downloadItem(id: UUID, torrent: ValidTorrent, processedBy: string) {
    return persistDownloadResults(this.em, id, torrent, processedBy);
  }

  @EnsureRequestContext()
  async getFanOutDownloadItems(id: UUID) {
    const item = await this.em.getRepository(MediaItem).findOneOrFail(id);

    if (item instanceof Show) {
      return item.seasons.matching({
        where: {
          isRequested: true,
          isSpecial: false,
          state: {
            $in: ["ongoing", "indexed", "scraped", "partially_completed"],
          },
        },
      });
    }

    if (item instanceof Season) {
      return item.episodes.matching({
        orderBy: { number: "asc" },
        where: { state: { $in: ["ongoing", "indexed", "scraped"] } },
      });
    }

    return [];
  }
}
