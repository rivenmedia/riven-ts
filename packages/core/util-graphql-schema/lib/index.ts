import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";
import {
  Episode,
  FileSystemEntry,
  MediaEntry,
  MediaItem,
  Season,
  Stream,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities";

import { EntityManager } from "@mikro-orm/core";
import { JSONObjectResolver } from "graphql-scalars";
import { type PubSub, buildSchema as baseBuildSchema } from "type-graphql";

import type { BaseContext } from "@apollo/server";
import type { DataSourceMap } from "@repo/util-plugin-sdk";

export interface ApolloServerContext extends BaseContext {
  [pluginSymbol: symbol]: {
    dataSources: DataSourceMap;
  };
  em: EntityManager;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const buildSchema = async (resolvers: Function[], pubSub: PubSub) =>
  baseBuildSchema({
    orphanedTypes: [
      SubtitleEntry,
      FileSystemEntry,
      MediaEntry,
      MediaItem,
      Episode,
      Season,
      Stream,
    ],
    pubSub,
    resolvers: [CoreSettingsResolver, RivenSettingsResolver, ...resolvers],
    scalarsMap: [{ type: Object, scalar: JSONObjectResolver }],
    validate: false,
  });
