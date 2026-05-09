import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class JellyfinSettings {
  @Field()
  apiKey!: string;
}
