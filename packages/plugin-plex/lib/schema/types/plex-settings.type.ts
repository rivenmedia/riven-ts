import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PlexSettings {
  @Field()
  apiKey!: string;
}
