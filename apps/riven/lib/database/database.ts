import { DownloaderService } from "./services/downloader/downloader.service.ts";
import { IndexerService } from "./services/indexer/indexer.service.ts";
import { ItemRequestService } from "./services/item-request/item-request.service.ts";
import { ScraperService } from "./services/scraper/scraper.service.ts";
import { VfsService } from "./services/vfs/vfs.service.ts";

import type {
  EntityManager,
  EntityRepository,
  MikroORM,
  Options,
} from "@mikro-orm/core";
import type {
  FileSystemEntry,
  ItemRequest,
  MediaEntry,
  MediaItem,
  Movie,
  Season,
  Show,
  Stream,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";
import type { EpisodeRepository } from "@repo/util-plugin-sdk/dto/repositories/episode.repository";

export interface Database {
  orm: MikroORM;
  em: EntityManager;
}

export interface Repositories {
  filesystemEntry: EntityRepository<FileSystemEntry>;
  mediaItem: EntityRepository<MediaItem>;
  itemRequest: EntityRepository<ItemRequest>;
  movie: EntityRepository<Movie>;
  episode: EpisodeRepository;
  show: EntityRepository<Show>;
  season: EntityRepository<Season>;
  mediaEntry: EntityRepository<MediaEntry>;
  subtitleEntry: EntityRepository<SubtitleEntry>;
  stream: EntityRepository<Stream>;
}

export interface Services {
  downloaderService: DownloaderService;
  indexerService: IndexerService;
  itemRequestService: ItemRequestService;
  scraperService: ScraperService;
  vfsService: VfsService;
}

export let database: Database;

export let repositories: Repositories;

export let services: Services;

export async function initORM(options: Partial<Options>) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (database) {
    return {
      database,
      repositories,
      services,
    };
  }

  const {
    Episode,
    FileSystemEntry,
    ItemRequest,
    MediaEntry,
    MediaItem,
    Movie,
    Season,
    Show,
    Stream,
    SubtitleEntry,
  } = await import("@repo/util-plugin-sdk/dto/entities");
  const { MikroORM } = await import("@mikro-orm/core");

  const orm = await MikroORM.init(options);

  // Save to cache before returning
  database = {
    orm,
    em: orm.em,
  };

  repositories = {
    filesystemEntry: orm.em.fork().getRepository(FileSystemEntry),
    mediaItem: orm.em.fork().getRepository(MediaItem),
    itemRequest: orm.em.fork().getRepository(ItemRequest),
    movie: orm.em.fork().getRepository(Movie),
    episode: orm.em.fork().getRepository(Episode),
    show: orm.em.fork().getRepository(Show),
    season: orm.em.fork().getRepository(Season),
    mediaEntry: orm.em.fork().getRepository(MediaEntry),
    subtitleEntry: orm.em.fork().getRepository(SubtitleEntry),
    stream: orm.em.fork().getRepository(Stream),
  };

  services = {
    downloaderService: new DownloaderService(orm),
    indexerService: new IndexerService(orm),
    itemRequestService: new ItemRequestService(orm),
    scraperService: new ScraperService(orm),
    vfsService: new VfsService(orm),
  };

  return {
    database,
    repositories,
    services,
  };
}
