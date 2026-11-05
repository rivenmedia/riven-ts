import { Field, ID, ObjectType } from "type-graphql";

import { SecretFieldState } from "./secret-field-state.type.ts";
import { SettingsIssue } from "./settings-issue.type.ts";

import type { z } from "zod";
import type { ZodStandardJSONSchemaPayload } from "zod/v4/core";

@ObjectType()
export class SettingsSection {
  @Field(() => ID)
  public id!: string;

  @Field()
  public title!: string;

  @Field(() => Object)
  public jsonSchema!: ZodStandardJSONSchemaPayload<z.ZodObject>;

  @Field(() => Object)
  public values!: Record<string, unknown>;

  @Field(() => [String])
  public lockedFields!: string[];

  @Field(() => [SecretFieldState])
  public secretStates!: SecretFieldState[];

  @Field(() => [SettingsIssue])
  public issues!: SettingsIssue[];
}
