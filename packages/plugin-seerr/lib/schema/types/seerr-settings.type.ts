import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SeerrSettings {
  @Field()
  apiKey!: string;

  @Field()
  url!: string;

  @Field()
  filter!: string;
}
