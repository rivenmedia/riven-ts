import { EntityManager, MikroORM } from "@mikro-orm/core";
import { Module } from "@nestjs/common";

import { createRivenDatabaseConfig } from "./create-riven-database-config.ts";
import { initORM } from "./database.ts";
import { DownloaderService } from "./services/downloader/downloader.service.ts";
import { IndexerService } from "./services/indexer/indexer.service.ts";
import { ItemRequestService } from "./services/item-request/item-request.service.ts";
import { MediaEntryService } from "./services/media-entry/media-entry.service.ts";
import { MediaItemService } from "./services/media-item/media-item.service.ts";
import { PostProcessingService } from "./services/post-processing/post-processing.service.ts";
import { RetryLibraryService } from "./services/retry-library/retry-library.service.ts";
import { ScraperService } from "./services/scraper/scraper.service.ts";
import { StreamService } from "./services/stream/stream.service.ts";
import { SubtitlesService } from "./services/subtitles/subtitles.service.ts";
import { VfsService } from "./services/vfs/vfs.service.ts";

const services = [
  DownloaderService,
  IndexerService,
  ItemRequestService,
  MediaEntryService,
  MediaItemService,
  PostProcessingService,
  RetryLibraryService,
  ScraperService,
  StreamService,
  SubtitlesService,
  VfsService,
];

/**
 * Exposes the database connection and its services to the DI container.
 *
 * `MikroOrmModule` is deliberately not used here. It always calls
 * `MikroORM.init` itself, which would open a second connection pool alongside
 * the one the bootstrap state machine creates, and would bypass the in-memory
 * database the test suite substitutes. Instead the connection is obtained
 * through `initORM`, which is idempotent: whichever caller runs first creates
 * the instance and every later caller receives it. Ownership moves to
 * `MikroOrmModule` once the bootstrap sequence belongs to Nest.
 */
@Module({
  providers: [
    {
      provide: MikroORM,
      useFactory: async () => {
        const { database } = await initORM(await createRivenDatabaseConfig());

        return database.orm;
      },
    },
    {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em,
      inject: [MikroORM],
    },
    ...services,
  ],
  exports: [MikroORM, EntityManager, ...services],
})
export class DatabaseModule {}
