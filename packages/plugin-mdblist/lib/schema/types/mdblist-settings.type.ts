import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdblistSettings {
  @Field(() => String)
  public apiKey!: string;

  @Field(() => [String])
  public lists!: string[];
}
