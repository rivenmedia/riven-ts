import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TmdbSettings {
  @Field()
  apiKey!: string;
}
