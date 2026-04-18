import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { MdblistSettings } from "./types/mdblist-settings.type.ts";

@Resolver(() => Settings)
export class MdblistSettingsResolver {
  @FieldResolver(() => MdblistSettings)
  mdblist(): MdblistSettings {
    return {
      apiKey: "mdblist-api-key",
      lists: ["list1", "list2", "list3"],
    };
  }
}
