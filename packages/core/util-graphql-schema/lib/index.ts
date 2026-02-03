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
  RequestedItem,
  Season,
  Show,
  Stream,
  SubtitleEntry,
} from "@repo/util-plugin-sdk/dto/entities/index";

import { buildSchema as baseBuildSchema } from "type-graphql";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const buildSchema = async (pluginResolvers: Function[]) =>
  baseBuildSchema({
    orphanedTypes: [
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
    ],
    resolvers: [
      CoreSettingsResolver,
      RivenSettingsResolver,
      ...pluginResolvers,
    ],
    validate: true,
  });
