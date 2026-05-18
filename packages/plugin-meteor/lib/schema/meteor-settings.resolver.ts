import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { MeteorSettings } from "./types/meteor-settings.type.ts";

@Resolver(() => Settings)
export class MeteorSettingsResolver {
  @FieldResolver(() => MeteorSettings)
  meteor(): MeteorSettings {
    return {
      apiKey: "meteor-api-key",
    };
  }
}
