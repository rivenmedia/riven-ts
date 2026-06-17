import { JSONObjectResolver } from "graphql-scalars";
import { Arg, Mutation, Query, Resolver } from "type-graphql";

import { CoreContext } from "../../decorators/core-context.ts";
import { UpdateSettingsInput } from "./inputs/update-settings.input.ts";

@Resolver()
export class SettingsResolver {
  @Query(() => JSONObjectResolver)
  async settings(
    @CoreContext() { services }: CoreContext,
    @Arg("namespace", () => String) namespace: string,
  ) {
    return services.settingsService.getSettingsByNamespace(namespace);
  }

  @Mutation(() => Boolean)
  async updateSettings(
    @CoreContext() { services }: CoreContext,
    @Arg("settings", () => UpdateSettingsInput)
    { settings }: UpdateSettingsInput,
  ) {
    await services.settingsService.updateBulkSettings(settings);

    const { settings: settingsInstance } =
      await import("../../../utilities/settings.ts");

    await settingsInstance.syncCoreSettings();

    return true;
  }
}
