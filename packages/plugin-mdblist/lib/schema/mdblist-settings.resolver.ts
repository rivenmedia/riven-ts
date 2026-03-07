import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { MdblistSettings } from "./types/mdblist-settings.type.ts";

@Resolver((_of) => Settings)
export class MdblistSettingsResolver {
  @FieldResolver((_returns) => MdblistSettings)
  mdblist(): MdblistSettings {
    return {
      apiKey: "mdblist-api-key",
      lists: ["list1", "list2", "list3"],
    };
  }
}
