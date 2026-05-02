import { Settings } from "@rivenmedia/plugin-sdk";

import { FieldResolver, Query, Resolver } from "type-graphql";

import { RivenSettings } from "./types/settings.type.ts";

@Resolver()
export class CoreSettingsResolver {
  @Query(() => Settings)
  settings(): Settings {
    return {};
  }
}

@Resolver(() => Settings)
export class RivenSettingsResolver {
  @FieldResolver(() => RivenSettings)
  riven(): RivenSettings {
    return {
      version: "1.0.0",
      apiKey: "1234",
      logLevel: "SILLY",
    };
  }
}
