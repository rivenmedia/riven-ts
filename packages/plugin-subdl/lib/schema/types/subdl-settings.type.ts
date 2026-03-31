import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SubdlSettings {
  @Field()
  apiKey!: string;

  @Field(() => [String])
  languages!: string[];
}
