import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TmdbSettings {
  @Field(() => String)
  apiKey!: string;
}
