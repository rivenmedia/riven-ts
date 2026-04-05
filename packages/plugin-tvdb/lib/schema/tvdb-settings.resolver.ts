import { Settings } from "@repo/util-plugin-sdk/schemas/settings.type";

import { FieldResolver, Resolver } from "type-graphql";

import { TvdbSettings } from "./types/tvdb-settings.type.ts";

@Resolver((_of) => Settings)
export class TvdbSettingsResolver {
  @FieldResolver((_returns) => TvdbSettings)
  tvdb(): TvdbSettings {
    return {
      apiKey: "tvdb-api-key",
    };
  }
}
