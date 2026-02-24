import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ExternalIds {
  @Field((_type) => String, { nullable: true })
  imdbId?: string | undefined;

  @Field((_type) => String, { nullable: true })
  tmdbId?: string | undefined;

  @Field((_type) => String, { nullable: true })
  tvdbId?: string | undefined;

  @Field((_type) => String, { nullable: true })
  externalId?: string | undefined;
}
