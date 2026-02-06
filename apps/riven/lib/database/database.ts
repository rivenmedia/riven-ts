import {
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
} from "@repo/util-plugin-sdk/dto/entities";

import {
  EntityManager,
  EntityRepository,
  MikroORM,
  type Options,
} from "@mikro-orm/postgresql";

export interface Services {
  orm: MikroORM;
  em: EntityManager;
  filesystemEntry: EntityRepository<FileSystemEntry>;
  mediaItem: EntityRepository<MediaItem>;
  itemRequest: EntityRepository<ItemRequest>;
  movie: EntityRepository<Movie>;
  episode: EntityRepository<Episode>;
  show: EntityRepository<Show>;
  season: EntityRepository<Season>;
  mediaEntry: EntityRepository<MediaEntry>;
  subtitleEntry: EntityRepository<SubtitleEntry>;
  stream: EntityRepository<Stream>;
}

export let database: Services;

export async function initORM(options?: Options): Promise<Services> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (database) {
    return database;
  }

  const orm = await MikroORM.init(options);

  // Save to cache before returning
  return (database = {
    orm,
    em: orm.em,
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
  });
}
