import { JSONResolver } from "graphql-scalars";
import { Field, InputType } from "type-graphql";

@InputType()
export class SeerrHandleWebhookInput {
  @Field(() => JSONResolver)
  payload!: unknown;
}
