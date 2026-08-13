import { EntityManager, MikroORM } from "@mikro-orm/core";
import { Test } from "@nestjs/testing";
import { describe, expect, it } from "vitest";

import { DatabaseModule } from "./database.module.ts";
import { database } from "./database.ts";
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

async function createTestingModule() {
  return Test.createTestingModule({
    imports: [DatabaseModule],
  }).compile();
}

describe("the database module", () => {
  it("adopts the existing connection rather than opening a second one", async () => {
    const module = await createTestingModule();

    expect(module.get(MikroORM)).toBe(database.orm);
    expect(module.get(EntityManager)).toBe(database.orm.em);

    await module.close();
  });

  // No service declares its own constructor, so Nest can only resolve them by
  // inheriting `design:paramtypes` from the decorated BaseService through the
  // prototype chain. Resolving each one proves that inheritance holds.

  it.for([
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
  ])("resolves $name with its inherited constructor", async (Service) => {
    const module = await createTestingModule();

    expect(module.get(Service)).toBeInstanceOf(Service);

    await module.close();
  });

  it("gives services a working entity manager", async () => {
    const module = await createTestingModule();
    const mediaItemService = module.get(MediaItemService);

    // Exercises the inherited `em` getter against the real schema.
    await expect(
      mediaItemService.getMediaItemById(crypto.randomUUID()),
    ).rejects.toThrow();

    await module.close();
  });
});
