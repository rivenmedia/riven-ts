import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TvdbSettings {
  @Field()
  apiKey!: string;
}
