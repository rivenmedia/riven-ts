import { CacheControl } from "@repo/core-util-graphql-helpers/caching/cache-control.directive";

import { Arg, Mutation, Query, Resolver } from "type-graphql";

import { User } from "../../../database/entities/user.entity.ts";
import { CoreContext } from "../../decorators/core-context.ts";
import { LoginUserInput } from "./inputs/login-user.input.ts";
import { RegisterUserInput } from "./inputs/register-user.input.js";
import { AuthProvider } from "./types/auth-provider.type.ts";

@Resolver()
export class AuthResolver {
  @Mutation(() => User)
  async registerUser(
    @CoreContext() { services: { authService } }: CoreContext,
    @Arg("input", () => RegisterUserInput) input: RegisterUserInput,
  ): Promise<User> {
    return authService.registerUser(input);
  }

  @Mutation(() => User)
  async loginUser(
    @CoreContext() { services: { authService } }: CoreContext,
    @Arg("input", () => LoginUserInput) input: LoginUserInput,
  ): Promise<User> {
    return authService.loginUser(input);
  }

  @CacheControl({ maxAge: Infinity })
  @Query(() => [AuthProvider])
  authProviders(
    @CoreContext() { services: { authService } }: CoreContext,
  ): AuthProvider[] {
    return authService.getAvailableAuthProviders();
  }
}
