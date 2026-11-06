import { Field, ObjectType } from "type-graphql";

import { PluginSummary } from "./plugin-summary.type.ts";

@ObjectType()
export class PluginList {
  @Field(() => [PluginSummary])
  public plugins!: PluginSummary[];

  @Field()
  public enabledPluginsLocked!: boolean;
}
