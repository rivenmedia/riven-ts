import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { JellyfinSettings } from "./types/jellyfin-settings.type.ts";

@Resolver(() => Settings)
export class JellyfinSettingsResolver {
  @FieldResolver(() => JellyfinSettings)
  jellyfin(): JellyfinSettings {
    return {
      apiKey: "jellyfin-api-key",
    };
  }
}
