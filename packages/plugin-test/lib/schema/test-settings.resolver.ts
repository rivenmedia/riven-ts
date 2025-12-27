import { TestSettings } from "./types/test-settings.type.ts";
import { FieldResolver, Resolver } from "type-graphql";
import { Settings } from "@repo/util-plugin-sdk";

@Resolver((_of) => Settings)
export class TestSettingsResolver {
  @FieldResolver((_returns) => TestSettings)
  test(): TestSettings {
    return {
      apiKey: "test-api-key",
    };
  }
}
