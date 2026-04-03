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

// eslint-disable-next-line no-restricted-imports -- Core database config requires direct driver access
import { defineConfig } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { SeedManager } from "@mikro-orm/seeder";
import * as Sentry from "@sentry/node";

import { logger } from "../utilities/logger/logger.ts";
import { settings } from "../utilities/settings.ts";
import { MediaItemFullTitleSubscriber } from "./subscribers/media-item-full-title.subscriber.ts";
import { MediaItemStateSubscriber } from "./subscribers/media-item-state.subscriber.ts";
import { ShowLikeMediaItemReleaseDateSubscriber } from "./subscribers/show-like-media-item-release-date.subscriber.ts";

export const databaseConfig = defineConfig({
  metadataProvider: TsMorphMetadataProvider,
  entities: [
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
  ],
  extensions: [SeedManager],
  clientUrl: settings.databaseUrl,
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
});

// Export default for CLI usage
export default databaseConfig;
