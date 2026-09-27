import { Field, InputType, Int } from "type-graphql";

@InputType()
export class RequestPreferencesInput {
  @Field(() => [String], { nullable: true })
  public resolutions?: string[];

  @Field(() => String, { nullable: true })
  public language?: string;
}

@InputType()
export class RequestItemInput {
  @Field(() => String)
  public type!: "movie" | "show";

  @Field(() => String, { nullable: true })
  public imdbId?: string | null;

  @Field(() => String, { nullable: true })
  public tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  public tvdbId?: string | null;

  @Field(() => [Int], { nullable: true })
  public seasons?: number[] | null;

  @Field(() => RequestPreferencesInput, { nullable: true })
  public preferences?: RequestPreferencesInput | null;
}
