import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdbListExternalIds {
  @Field(() => String, { nullable: true })
  public imdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  public tmdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  public tvdbId?: string | undefined;

  @Field(() => String, { nullable: true })
  public externalRequestId?: string | undefined;
}
