import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdblistSettings {
  @Field(() => String)
  apiKey!: string;

  @Field(() => [String])
  lists!: string[];
}
