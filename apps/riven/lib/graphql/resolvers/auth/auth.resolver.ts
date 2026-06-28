import { Arg, Mutation, Resolver } from "type-graphql";

import { User } from "../../../database/entities/user.entity.ts";
import { CoreContext } from "../../decorators/core-context.ts";
import { LoginUserInput } from "./inputs/login-user.input.ts";
import { RegisterUserInput } from "./inputs/register-user.input.js";

@Resolver()
export class AuthResolver {
  @Mutation(() => User)
  async registerUser(
    @CoreContext() { services: { userService } }: CoreContext,
    @Arg("input", () => RegisterUserInput) input: RegisterUserInput,
  ): Promise<User> {
    return userService.registerUser(input);
  }

  @Mutation(() => User)
  async loginUser(
    @CoreContext() { services: { userService } }: CoreContext,
    @Arg("input", () => LoginUserInput) input: LoginUserInput,
  ): Promise<User> {
    return userService.loginUser(input);
  }
}
