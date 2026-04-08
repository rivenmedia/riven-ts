import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";
import {
  Episode,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Movie,
  Season,
  Show,
  Stream,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import {
  type BuildSchemaOptions,
  buildSchema as baseBuildSchema,
} from "type-graphql";

import type { EntityManager } from "@mikro-orm/core";
import type { DataSourceMap } from "@repo/util-plugin-sdk";

export type ApolloServerContext = Partial<
  Record<symbol, { dataSources: DataSourceMap }>
> & {
  em: EntityManager;
};

export const buildSchema = async (options: BuildSchemaOptions) =>
  baseBuildSchema({
    ...options,
    orphanedTypes: [
      SubtitleEntry,
      FileSystemEntry,
      MediaEntry,
      MediaItem,
      Episode,
      Movie,
      Season,
      Show,
      Stream,
    ],
    resolvers: [
      CoreSettingsResolver,
      RivenSettingsResolver,
      ...options.resolvers,
    ],
    validate: true,
  });
