import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TmdbSettings {
  @Field()
  public apiKey!: string;
}
