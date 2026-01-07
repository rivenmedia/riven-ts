import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { TmdbSettings } from "./types/tmdb-settings.type.ts";

@Resolver((_of) => Settings)
export class TmdbSettingsResolver {
  @FieldResolver((_returns) => TmdbSettings)
  tmdb(): TmdbSettings {
    return {
      apiKey: "tmdb-api-key",
    };
  }
}
