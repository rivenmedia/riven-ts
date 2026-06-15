import { Arg, Query, Resolver } from "type-graphql";

import { CoreContext } from "../decorators/core-context.ts";

@Resolver()
export class SettingsResolver {
  @Query(() => Object)
  async settings(
    @CoreContext() { services }: CoreContext,
    @Arg("namespace", () => String) namespace: string,
  ) {
    return services.settingsService.getSettingsByNamespace(namespace);
  }
}
