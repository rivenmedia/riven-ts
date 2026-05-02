import { Settings } from "@rivenmedia/plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { StremThruSettings } from "./types/stremthru-settings.type.ts";

@Resolver(() => Settings)
export class StremThruSettingsResolver {
  @FieldResolver(() => StremThruSettings)
  stremthru(): StremThruSettings {
    return {
      apiKey: "stremthru-api-key",
    };
  }
}
