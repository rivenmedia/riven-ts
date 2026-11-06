import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class PluginSummary {
  @Field(() => ID)
  public id!: string;

  @Field()
  public title!: string;

  @Field()
  public enabled!: boolean;

  @Field()
  public alwaysEnabled!: boolean;
}
