import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { ListrrSettings } from "./types/listrr-settings.type.ts";

@Resolver(() => Settings)
export class ListrrSettingsResolver {
  @FieldResolver(() => ListrrSettings)
  listrr(): ListrrSettings {
    return {
      apiKey: "listrr-api-key",
    };
  }
}
