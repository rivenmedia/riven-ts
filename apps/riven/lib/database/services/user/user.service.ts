import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { BaseService } from "../core/base-service.ts";
import { type LoginUserInput, loginUser } from "./utilities/login-user.ts";
import {
  type RegisterUserInput,
  registerUser,
} from "./utilities/register-user.ts";

export class UserService extends BaseService {
  @CreateRequestContext()
  async registerUser(input: RegisterUserInput) {
    return registerUser(this.em, input);
  }

  @CreateRequestContext()
  async loginUser(input: LoginUserInput) {
    return loginUser(this.em, input);
  }
}
