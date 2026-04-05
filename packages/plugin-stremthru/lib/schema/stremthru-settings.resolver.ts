import { Settings } from "@repo/util-plugin-sdk/schemas/settings.type";

import { FieldResolver, Resolver } from "type-graphql";

import { StremThruSettings } from "./types/stremthru-settings.type.ts";

@Resolver((_of) => Settings)
export class StremThruSettingsResolver {
  @FieldResolver((_returns) => StremThruSettings)
  stremthru(): StremThruSettings {
    return {
      apiKey: "stremthru-api-key",
    };
  }
}
