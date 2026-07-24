import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class PlexSettings {
  @Field()
  public apiKey!: string;
}
