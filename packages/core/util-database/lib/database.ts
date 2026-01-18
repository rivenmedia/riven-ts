import {
  Episode,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Movie,
  RequestedItem,
  Season,
  Show,
  Stream,
} from "@repo/util-plugin-sdk/dto/entities/index";

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
  requestedItem: EntityRepository<RequestedItem>;
  movie: EntityRepository<Movie>;
  episode: EntityRepository<Episode>;
  show: EntityRepository<Show>;
  season: EntityRepository<Season>;
  mediaEntry: EntityRepository<MediaEntry>;
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
    requestedItem: orm.em.fork().getRepository(RequestedItem),
    movie: orm.em.fork().getRepository(Movie),
    episode: orm.em.fork().getRepository(Episode),
    show: orm.em.fork().getRepository(Show),
    season: orm.em.fork().getRepository(Season),
    mediaEntry: orm.em.fork().getRepository(MediaEntry),
    stream: orm.em.fork().getRepository(Stream),
  });
}
