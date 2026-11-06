import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SettingsIssue {
  @Field()
  public path!: string;

  @Field()
  public message!: string;
}
