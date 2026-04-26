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
import {
  GeneratedCacheAdapter,
  type Options,
  PostgreSqlDriver,
} from "@mikro-orm/postgresql";

import { withLogContext } from "../utilities/logger/log-context.ts";
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

async function getMetadataCacheConfig(): Promise<Options> {
  if (process.env["NODE_ENV"] === "production") {
    const { default: metadata } = await import(
      "@repo/riven/database-metadata-cache",
      { with: { type: "json" } }
    );

    return {
      metadataCache: {
        enabled: true,
        adapter: GeneratedCacheAdapter,
        options: {
          data: metadata,
        },
      },
    };
  }

  const { TsMorphMetadataProvider } = await import("@mikro-orm/reflection");

  return {
    metadataProvider: TsMorphMetadataProvider,
  };
}

interface CreateDatabaseConfigOptions extends Omit<Partial<Options>, "logger"> {
  logger?: Logger;
}

export async function createDatabaseConfig({
  logger,
  ...options
}: CreateDatabaseConfigOptions = {}): Promise<Partial<Options>> {
  const metadataCacheConfig = await getMetadataCacheConfig();

  return {
    driver: PostgreSqlDriver,
    entities,
    ...(logger && {
      logger: (message) => {
        withLogContext({ "riven.log.source": "database" }, () => {
          logger.data(message);
        });
      },
    }),
    migrations: {
      path: `${import.meta.dirname}/migrations`,
    },
    subscribers: [
      new MediaItemFullTitleSubscriber(),
      new ShowLikeMediaItemReleaseDateSubscriber(),
      new MediaItemStateSubscriber(),
    ],
    ...metadataCacheConfig,
    ...options,
  };
}
