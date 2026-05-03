import { DownloaderService } from "./services/downloader/downloader.service.ts";
import { IndexerService } from "./services/indexer/indexer.service.ts";
import { ItemRequestService } from "./services/item-request/item-request.service.ts";
import { MediaItemService } from "./services/media-item/media-item.service.js";
import { RetryLibraryService } from "./services/retry-library/retry-library.service.js";
import { ScraperService } from "./services/scraper/scraper.service.ts";
import { SubtitlesService } from "./services/subtitles/subtitles.service.ts";
import { VfsService } from "./services/vfs/vfs.service.ts";

import type { EntityManager, MikroORM, Options } from "@mikro-orm/core";

export interface Database {
  orm: MikroORM;
  em: EntityManager;
}

export interface Services {
  downloaderService: DownloaderService;
  indexerService: IndexerService;
  itemRequestService: ItemRequestService;
  mediaItemService: MediaItemService;
  retryLibraryService: RetryLibraryService;
  scraperService: ScraperService;
  subtitlesService: SubtitlesService;
  vfsService: VfsService;
}

export let database: Database;

export let services: Services;

export async function initORM(options: Partial<Options>) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (database) {
    return {
      database,
      services,
    };
  }

  const { MikroORM } = await import("@mikro-orm/core");

  const orm = await MikroORM.init(options);

  // Save to cache before returning
  database = {
    orm,
    em: orm.em,
  };

  services = {
    downloaderService: new DownloaderService(orm),
    indexerService: new IndexerService(orm),
    itemRequestService: new ItemRequestService(orm),
    mediaItemService: new MediaItemService(orm),
    retryLibraryService: new RetryLibraryService(orm),
    scraperService: new ScraperService(orm),
    subtitlesService: new SubtitlesService(orm),
    vfsService: new VfsService(orm),
  };

  return {
    database,
    services,
  };
}
