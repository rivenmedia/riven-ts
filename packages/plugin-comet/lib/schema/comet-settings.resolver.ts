import { Settings } from "@rivenmedia/plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { CometSettings } from "./types/comet-settings.type.ts";

@Resolver(() => Settings)
export class CometSettingsResolver {
  @FieldResolver(() => CometSettings)
  comet(): CometSettings {
    return {
      apiKey: "comet-api-key",
    };
  }
}
