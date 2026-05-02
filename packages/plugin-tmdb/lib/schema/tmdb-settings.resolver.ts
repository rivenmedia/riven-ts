import { Settings } from "@rivenmedia/plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { TmdbSettings } from "./types/tmdb-settings.type.ts";

@Resolver(() => Settings)
export class TmdbSettingsResolver {
  @FieldResolver(() => TmdbSettings)
  tmdb(): TmdbSettings {
    return {
      apiKey: "tmdb-api-key",
    };
  }
}
