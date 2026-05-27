import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { NewznabSettings } from "./types/newznab-settings.type.ts";

@Resolver(() => Settings)
export class NewznabSettingsResolver {
  @FieldResolver(() => NewznabSettings)
  newznab(): NewznabSettings {
    return {
      indexerUrl: "https://indexer.example.com",
      apiKey: "newznab-api-key",
      minSizeBytes: 100 * 1024 * 1024,
      maxSizeBytes: 100 * 1024 * 1024 * 1024,
      movieCategories: [2040, 2045],
      tvCategories: [5040, 5045],
    };
  }
}
