import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { SubdlSettings } from "./types/subdl-settings.type.ts";

@Resolver((_of) => Settings)
export class SubdlSettingsResolver {
  @FieldResolver((_returns) => SubdlSettings)
  subdl(): SubdlSettings {
    return {
      apiKey: "subdl-api-key",
      languages: ["en"],
    };
  }
}
