import { InputType, Field } from "type-graphql";

@InputType()
export class RequestItemInput {
  @Field(() => String)
  public requestedBy!: string;

  @Field(() => String, { nullable: true })
  public tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  public imdbId?: string | null;

  @Field(() => String, { nullable: true })
  public tvdbId?: string | null;
}
