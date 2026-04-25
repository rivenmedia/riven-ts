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

import { Migrator } from "@mikro-orm/migrations";
// eslint-disable-next-line no-restricted-imports -- Core database config requires direct driver access
import { type Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { SeedManager } from "@mikro-orm/seeder";
import * as Sentry from "@sentry/node";

import { settings } from "../utilities/settings.ts";
import { MediaItemFullTitleSubscriber } from "./subscribers/media-item-full-title.subscriber.ts";
import { MediaItemStateSubscriber } from "./subscribers/media-item-state.subscriber.ts";
import { ShowLikeMediaItemReleaseDateSubscriber } from "./subscribers/show-like-media-item-release-date.subscriber.ts";

import type { Logger } from "winston";

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

export function createDatabaseConfig(logger?: Logger) {
  return {
    driver: PostgreSqlDriver,
    metadataProvider: TsMorphMetadataProvider,
    entities,
    extensions: [SeedManager, Migrator],
    clientUrl: settings.databaseUrl,
    ...(logger && {
      logger: (message) => {
        Sentry.withScope((scope) => {
          scope.setTags({
            "riven.log.source": "database",
          });

          logger.data(message);
        });
      },
    }),
    debug: settings.databaseDebugLogging,
    seeder: {
      pathTs: "./seeders",
    },
    migrations: {
      path: `${import.meta.dirname}/migrations`,
    },
    subscribers: [
      new MediaItemFullTitleSubscriber(),
      new ShowLikeMediaItemReleaseDateSubscriber(),
      new MediaItemStateSubscriber(),
    ],
  } satisfies Partial<Options>;
}
