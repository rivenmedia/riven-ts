import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { ListrrSettings } from "./types/listrr-settings.type.ts";

@Resolver((_of) => Settings)
export class ListrrSettingsResolver {
  @FieldResolver((_returns) => ListrrSettings)
  listrr(): ListrrSettings {
    return {
      apiKey: "listrr-api-key",
    };
  }
}
