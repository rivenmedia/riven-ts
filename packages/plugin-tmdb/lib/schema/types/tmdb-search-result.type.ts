import { Field, Float, Int, ObjectType, registerEnumType } from "type-graphql";
import z from "zod";

export const TmdbSearchResultType = z.enum(["movie", "show"]);

export type TmdbSearchResultType = z.infer<typeof TmdbSearchResultType>;

registerEnumType(TmdbSearchResultType.enum, {
  name: "TmdbSearchResultType",
  description: "The type of media found by a TMDB search",
});

@ObjectType()
export class TmdbSearchResult {
  @Field(() => Int)
  public id!: number;

  @Field(() => TmdbSearchResultType.enum)
  public mediaType!: TmdbSearchResultType;

  @Field(() => String, { nullable: true })
  public title?: string | null;

  @Field(() => String, { nullable: true })
  public overview?: string | null;

  @Field(() => String, { nullable: true })
  public releaseDate?: string | null;

  @Field(() => String, { nullable: true })
  public posterPath?: string | null;

  @Field(() => String, { nullable: true })
  public originalLanguage?: string | null;

  @Field(() => Float, { nullable: true })
  public voteAverage?: number | null;
}
