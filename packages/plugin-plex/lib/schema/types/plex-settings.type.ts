import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PlexSettings {
  @Field(() => String)
  apiKey!: string;
}
