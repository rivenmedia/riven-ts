import { Query, Resolver } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

import { InstanceStatus } from "./types/instance-status.type.ts";

@Resolver()
export class InstanceResolver {
  @Query(() => InstanceStatus)
  public instanceStatus(@CoreContext() { settingsManager }: CoreContext) {
    return {
      setupRequired: false,
      restartRequired: settingsManager.restartRequired,
    };
  }
}
