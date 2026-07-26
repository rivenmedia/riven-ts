import { Field, ObjectType } from "type-graphql";

import type { AuthProvider as IAuthProvider } from "../../../../auth/get-auth-providers.ts";

@ObjectType()
export class AuthProvider implements IAuthProvider {
  @Field()
  public key!: string;

  @Field()
  public enabled!: boolean;

  @Field()
  public disableSignup!: boolean;

  @Field({ nullable: true })
  public name?: string;

  @Field(() => String, { nullable: true })
  public icon?: string | undefined;
}
