import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { SeerrSettings } from "./types/seerr-settings.type.ts";

@Resolver((_of) => Settings)
export class SeerrSettingsResolver {
  @FieldResolver((_returns) => SeerrSettings)
  seerr(): SeerrSettings {
    return {
      apiKey: "seerr-api-key",
      url: "seerr-url",
      filter: "seerr-filter",
    };
  }
}
