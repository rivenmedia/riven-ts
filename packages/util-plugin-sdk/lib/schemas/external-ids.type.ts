import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ExternalIds {
  @Field(() => String, { nullable: true })
  public imdbId?: string | null | undefined;

  @Field(() => String, { nullable: true })
  public tmdbId?: string | null | undefined;

  @Field(() => String, { nullable: true })
  public tvdbId?: string | null | undefined;
}
