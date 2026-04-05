import { Settings } from "@repo/util-plugin-sdk/schemas/settings.type";

import { FieldResolver, Resolver } from "type-graphql";

import { PlexSettings } from "./types/plex-settings.type.ts";

@Resolver((_of) => Settings)
export class PlexSettingsResolver {
  @FieldResolver((_returns) => PlexSettings)
  plex(): PlexSettings {
    return {
      apiKey: "plex-api-key",
    };
  }
}
