import { Field, InputType } from "type-graphql";

@InputType()
export class SeerrHandleWebhookInput {
  @Field(() => Object)
  public payload!: unknown;
}
