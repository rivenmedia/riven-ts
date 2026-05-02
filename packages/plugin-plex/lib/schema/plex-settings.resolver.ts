import { Settings } from "@rivenmedia/plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { PlexSettings } from "./types/plex-settings.type.ts";

@Resolver(() => Settings)
export class PlexSettingsResolver {
  @FieldResolver(() => PlexSettings)
  plex(): PlexSettings {
    return {
      apiKey: "plex-api-key",
    };
  }
}
