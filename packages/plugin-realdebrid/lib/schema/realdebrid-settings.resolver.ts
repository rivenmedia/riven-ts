import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { RealDebridSettings } from "./types/realdebrid-settings.type.ts";

@Resolver((_of) => Settings)
export class RealDebridSettingsResolver {
  @FieldResolver((_returns) => RealDebridSettings)
  realdebrid(): RealDebridSettings {
    return {
      apiKey: "realdebrid-api-key",
    };
  }
}
