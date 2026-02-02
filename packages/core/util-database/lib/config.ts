import { logger } from "@repo/core-util-logger";
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
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { type Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { z } from "zod";

export const entities = [
  SubtitleEntry,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Episode,
  Movie,
  Season,
  Show,
  RequestedItem,
  Stream,
];

export const databaseConfig = {
  driver: PostgreSqlDriver,
  metadataProvider: TsMorphMetadataProvider,
  entities,
  forceUtcTimezone: true,
  clientUrl: z.string().parse(process.env["DATABASE_URL"]),
  logger: (message) => {
    logger.verbose(message);
  },
} satisfies Options;
