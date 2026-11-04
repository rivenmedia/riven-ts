import { Field, ObjectType } from "type-graphql";

import { SecretState } from "./enums/secret-state.enum.ts";

@ObjectType()
export class SecretFieldState {
  @Field()
  public path!: string;

  @Field(() => SecretState.enum)
  public state!: SecretState;
}
