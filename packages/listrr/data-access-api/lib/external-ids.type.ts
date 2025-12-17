import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ExternalIds {
  @Field({ nullable: true })
  imdbId?: string;

  @Field({ nullable: true })
  tmdbId?: number;
}
