import { Query, Resolver } from "type-graphql";

import { InstanceStatus } from "./types/instance-status.type.ts";

@Resolver()
export class InstanceResolver {
  @Query(() => InstanceStatus)
  public instanceStatus() {
    return {
      setupRequired: false,
    };
  }
}
