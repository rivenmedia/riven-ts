import { Settings } from "@repo/util-plugin-sdk";

import { FieldResolver, Resolver } from "type-graphql";

import { SiloSettings } from "./types/silo-settings.type.ts";

@Resolver(() => Settings)
export class SiloSettingsResolver {
  @FieldResolver(() => SiloSettings)
  public silo(): SiloSettings {
    return {
      apiKey: "silo-api-key",
    };
  }
}
