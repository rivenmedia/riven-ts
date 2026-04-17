import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdbListExternalIds {
  @Field(() => String, { nullable: true })
  imdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  tmdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  tvdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  externalRequestId?: string | undefined;
}
