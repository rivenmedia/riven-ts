import { Field, Int, ObjectType } from "type-graphql";

@ObjectType()
export class TmdbShowDetails {
  @Field(() => Int)
  public id!: number;

  @Field(() => String, { nullable: true })
  public name?: string | null;

  @Field(() => Int)
  public numberOfSeasons!: number;

  /**
   * The TVDB ID of the show, if TMDB knows one. Shows are indexed from TVDB,
   * so show requests need this ID to be resolvable.
   */
  @Field(() => String, { nullable: true })
  public tvdbId?: string | null;
}
