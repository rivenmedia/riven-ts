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

import type { Services } from "./database.ts";
import type { Provider, Type } from "@nestjs/common";

const RIVEN_DATABASE = Symbol("RIVEN_DATABASE");

type ServiceEntry = {
  [K in keyof Services]: [Type<Services[K]>, K];
}[keyof Services];

const serviceEntries: ServiceEntry[] = [
  [DownloaderService, "downloaderService"],
  [IndexerService, "indexerService"],
  [ItemRequestService, "itemRequestService"],
  [MediaEntryService, "mediaEntryService"],
  [MediaItemService, "mediaItemService"],
  [PostProcessingService, "postProcessingService"],
  [RetryLibraryService, "retryLibraryService"],
  [ScraperService, "scraperService"],
  [StreamService, "streamService"],
  [SubtitlesService, "subtitlesService"],
  [VfsService, "vfsService"],
];

const serviceProviders: Provider[] = serviceEntries.map(([token, key]) => ({
  provide: token,
  useFactory: ({ services }: Awaited<ReturnType<typeof initORM>>) =>
    services[key],
  inject: [RIVEN_DATABASE],
}));

/**
 * Exposes the database connection and its services to the DI container.
 *
 * `MikroOrmModule` is deliberately not used. It always calls `MikroORM.init`
 * itself, which would open a second connection pool alongside the one the
 * bootstrap state machine creates, and would bypass the in-memory database the
 * test suite substitutes. The connection is instead obtained through `initORM`,
 * which is idempotent: whichever caller runs first creates the instance and
 * every later caller receives it.
 *
 * The services are likewise surfaced from the existing `services` singleton
 * rather than constructed anew. Most of the codebase still reaches them through
 * that singleton, and a second set of instances would mean a stub applied to
 * one was invisible to the other. Ownership moves to Nest, and these become
 * ordinary class providers, once the singleton is removed.
 */
@Module({
  providers: [
    {
      provide: RIVEN_DATABASE,
      useFactory: async () => initORM(await createRivenDatabaseConfig()),
    },
    {
      provide: MikroORM,
      useFactory: ({ database }: Awaited<ReturnType<typeof initORM>>) =>
        database.orm,
      inject: [RIVEN_DATABASE],
    },
    {
      provide: EntityManager,
      useFactory: (orm: MikroORM) => orm.em,
      inject: [MikroORM],
    },
    ...serviceProviders,
  ],
  exports: [MikroORM, EntityManager, ...serviceEntries.map(([token]) => token)],
})
export class DatabaseModule {}
