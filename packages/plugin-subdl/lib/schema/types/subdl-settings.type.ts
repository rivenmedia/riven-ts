import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SubdlSettings {
  @Field()
  public apiKey!: string;

  @Field(() => [String])
  public languages!: string[];
}
