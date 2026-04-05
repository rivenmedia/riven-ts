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

import { DataloaderType } from "@mikro-orm/core";
// eslint-disable-next-line no-restricted-imports -- Core database config requires direct driver access
import { type Options, PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { SeedManager } from "@mikro-orm/seeder";
import * as Sentry from "@sentry/node";

import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { MediaItemFullTitleSubscriber } from "./subscribers/media-item-full-title.subscriber.ts";
import { MediaItemStateSubscriber } from "./subscribers/media-item-state.subscriber.ts";
import { ShowLikeMediaItemReleaseDateSubscriber } from "./subscribers/show-like-media-item-release-date.subscriber.ts";

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
  extensions: [SeedManager],
  clientUrl: settings.databaseUrl,
  dataloader: DataloaderType.ALL,
  logger: (message) => {
    Sentry.withScope((scope) => {
      scope.setTags({
        "riven.log.source": "database",
      });

      logger.verbose(message);
    });
  },
  seeder: {
    pathTs: "./seeders",
  },
  subscribers: [
    new MediaItemFullTitleSubscriber(),
    new ShowLikeMediaItemReleaseDateSubscriber(),
    new MediaItemStateSubscriber(),
  ],
} satisfies Partial<Options>;
