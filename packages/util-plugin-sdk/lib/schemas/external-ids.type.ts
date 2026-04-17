import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ExternalIds {
  @Field(() => String, { nullable: true })
  imdbId?: string | null | undefined;

  @Field(() => String, { nullable: true })
  tmdbId?: string | null | undefined;

  @Field(() => String, { nullable: true })
  tvdbId?: string | null | undefined;
}
