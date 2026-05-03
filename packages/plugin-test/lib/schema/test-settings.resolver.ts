import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { TestSettings } from "./types/test-settings.type.ts";

@Resolver(() => Settings)
export class TestSettingsResolver {
  @FieldResolver(() => TestSettings)
  test(): TestSettings {
    return {
      apiKey: "test-api-key",
    };
  }
}
