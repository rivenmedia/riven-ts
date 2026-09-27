import { Field, ObjectType } from "type-graphql";

import { Rating } from "./rating.type.ts";

@ObjectType()
export class Ratings {
  @Field(() => Rating, { nullable: true })
  public imdb?: Rating | null;

  @Field(() => Rating, { nullable: true })
  public tmdb?: Rating | null;

  @Field(() => Rating, { nullable: true })
  public metacritic?: Rating | null;

  @Field(() => Rating, { nullable: true })
  public rottenTomatoes?: Rating | null;

  @Field(() => Rating, { nullable: true })
  public trakt?: Rating | null;
}
