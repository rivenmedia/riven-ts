import { RivenSettings } from "./types/settings.type.ts";
import { Settings } from "@repo/util-plugin-sdk";
import { FieldResolver, Query, Resolver } from "type-graphql";

@Resolver()
export class CoreSettingsResolver {
  @Query(() => Settings)
  settings(): Settings {
    return {};
  }
}

@Resolver((_of) => Settings)
export class RivenSettingsResolver {
  @FieldResolver((_returns) => RivenSettings)
  riven(): RivenSettings {
    return {
      version: "1.0.0",
      apiKey: "1234",
      logLevel: "SILLY",
    };
  }
}
