import { Settings } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

@Resolver()
export class CoreSettingsResolver {
  @Query(() => Settings)
  settings(): Settings {
    return {};
  }
}
