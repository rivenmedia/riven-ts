import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { CometSettings } from "./types/comet-settings.type.ts";

@Resolver((_of) => Settings)
export class CometSettingsResolver {
  @FieldResolver((_returns) => CometSettings)
  comet(): CometSettings {
    return {
      apiKey: "comet-api-key",
    };
  }
}
