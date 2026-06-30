import { Field, ObjectType } from "type-graphql";

import type { AuthProvider as IAuthProvider } from "../../../../auth/get-auth-providers.ts";

@ObjectType()
export class AuthProvider implements IAuthProvider {
  @Field()
  key!: string;

  @Field()
  enabled!: boolean;

  @Field()
  disableSignup!: boolean;

  @Field({ nullable: true })
  name?: string;

  @Field(() => String, { nullable: true })
  icon?: string | undefined;
}
