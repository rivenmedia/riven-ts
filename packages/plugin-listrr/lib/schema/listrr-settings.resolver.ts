import { ListrrSettings } from "./types/listrr-settings.type.js";
import { FieldResolver, Resolver } from "type-graphql";
import { Settings } from "@repo/feature-settings/settings.type";

@Resolver((_of) => Settings)
export class ListrrSettingsResolver {
  @FieldResolver((_returns) => ListrrSettings)
  listrr(): ListrrSettings {
    return {
      apiKey: "listrr-api-key",
    };
  }
}
