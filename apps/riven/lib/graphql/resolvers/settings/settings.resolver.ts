import { Query, Resolver } from "type-graphql";

import { RivenSettings } from "#riven-settings.schema.ts";

@Resolver()
export class SettingsResolver {
  @Query(() => Object, {
    description: "Returns the JSON schema for the Riven settings",
  })
  public settingsSchema() {
    return RivenSettings.toJSONSchema({
      unrepresentable: "any",
    });
  }
}
