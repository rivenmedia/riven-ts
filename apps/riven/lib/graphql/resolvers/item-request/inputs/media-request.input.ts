import { Field, InputType } from "type-graphql";

@InputType()
export class MediaRequestInput {
  @Field(() => String, { nullable: true })
  externalRequestId?: string;

  @Field(() => String, { nullable: true })
  requestedBy?: string;

  @Field(() => String, { nullable: true })
  imdbId?: string;
}
