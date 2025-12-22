import { Settings } from "./types/settings.type.ts";
import { Query, Resolver } from "type-graphql";

@Resolver()
export class SettingsResolver {
  @Query(() => Settings)
  settings(): Settings {
    return {
      version: "1.0.0",
      apiKey: "1234",
      logLevel: "TRACE",
    };
  }
}
