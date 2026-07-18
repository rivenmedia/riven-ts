import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import {
  type AuthProvider,
  getAuthProviders,
} from "../../../auth/get-auth-providers.ts";
import { User } from "../../entities/user.entity.ts";
import { BaseService } from "../core/base-service.ts";
import {
  type CreateAdminUserInput,
  createAdminUser,
} from "./utilities/create-admin-user.ts";
import { type LoginUserInput, loginUser } from "./utilities/login-user.ts";
import {
  type RegisterUserInput,
  registerUser,
} from "./utilities/register-user.ts";

export class AuthService extends BaseService {
  @CreateRequestContext()
  async createAdminUser(input: CreateAdminUserInput) {
    return createAdminUser(input);
  }

  getAvailableAuthProviders(): AuthProvider[] {
    return Object.values(getAuthProviders());
  }

  @CreateRequestContext()
  async hasExistingAdminUser() {
    const adminCount = await this.em.count(User, { role: "admin" });

    return adminCount > 0;
  }

  @CreateRequestContext()
  async registerUser(input: RegisterUserInput) {
    return registerUser(this.em, input);
  }

  @CreateRequestContext()
  async loginUser(input: LoginUserInput) {
    return loginUser(this.em, input);
  }
}
