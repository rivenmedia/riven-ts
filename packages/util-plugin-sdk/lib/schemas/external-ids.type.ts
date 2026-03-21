import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ExternalIds {
  @Field((_type) => String, { nullable: true })
  imdbId?: string | null | undefined;

  @Field((_type) => String, { nullable: true })
  tmdbId?: string | null | undefined;

  @Field((_type) => String, { nullable: true })
  tvdbId?: string | null | undefined;
}
