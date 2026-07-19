import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class JellyfinSettings {
  @Field()
  public apiKey!: string;
}
