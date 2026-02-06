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

import { type Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";

export const entities = [
  SubtitleEntry,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Episode,
  Movie,
  Season,
  Show,
  ItemRequest,
  Stream,
];

export const databaseConfig = {
  driver: PostgreSqlDriver,
  metadataProvider: TsMorphMetadataProvider,
  entities,
  forceUtcTimezone: true,
  clientUrl: settings.databaseUrl,
  logger: (message) => {
    logger.verbose(message);
  },
} satisfies Options;
