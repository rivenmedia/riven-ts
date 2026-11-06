import { Field, ObjectType } from "type-graphql";

import { SettingsIssue } from "./settings-issue.type.ts";

@ObjectType()
export class SettingsMutationResult {
  @Field()
  public success!: boolean;

  @Field(() => [SettingsIssue])
  public issues!: SettingsIssue[];
}
