import "reflect-metadata";
import { LogLevel } from "@repo/feature-settings/enums/log-level.enum";

import { Field, ObjectType } from "type-graphql";

/**
 * type-graphql only emits enums that are reachable from a field, but clients
 * (such as the logs viewer) depend on `LogLevel`. Registering this type as an
 * orphaned type keeps the enum in the schema.
 */
@ObjectType({
  description: "Keeps the LogLevel enum available to clients. Not queryable.",
})
export class LogLevelAnchor {
  @Field(() => LogLevel)
  public logLevel!: (typeof LogLevel)[keyof typeof LogLevel];
}
