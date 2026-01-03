import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";
import { parsePluginsFromDependencies } from "@repo/util-plugin-sdk";
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

import { buildSchema } from "type-graphql";

import packageJson from "../package.json" with { type: "json" };

const { validPlugins } = await parsePluginsFromDependencies(
  packageJson.dependencies,
  import.meta.resolve.bind(null),
);

export const schema = await buildSchema({
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
    ...validPlugins.flatMap((p) => p.resolvers),
  ],
  validate: true,
});
