import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { CometSettings } from "./types/comet-settings.type.ts";

@Resolver(() => Settings)
export class CometSettingsResolver {
  @FieldResolver(() => CometSettings)
  public comet(): CometSettings {
    return {
      apiKey: "comet-api-key",
    };
  }
}
