import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { getAuthProviders } from "../../../auth/get-auth-providers.ts";
import { User } from "../../entities/user.entity.ts";
import { BaseService } from "../core/base-service.ts";
import { createAdminUser } from "./utilities/create-admin-user.ts";
import { loginUser } from "./utilities/login-user.ts";
import { registerUser } from "./utilities/register-user.ts";

import type { AuthProvider } from "../../../auth/get-auth-providers.ts";
import type { CreateAdminUserInput } from "./utilities/create-admin-user.ts";
import type { LoginUserInput } from "./utilities/login-user.ts";
import type { RegisterUserInput } from "./utilities/register-user.ts";

export class AuthService extends BaseService {
  @CreateRequestContext()
  public async createAdminUser(input: CreateAdminUserInput) {
    return createAdminUser(input);
  }

  public getAvailableAuthProviders(): AuthProvider[] {
    return Object.values(getAuthProviders());
  }

  @CreateRequestContext()
  public async hasExistingAdminUser() {
    const adminCount = await this.em.count(User, { role: "admin" });

    return adminCount > 0;
  }

  @CreateRequestContext()
  public async registerUser(input: RegisterUserInput) {
    return registerUser(this.em, input);
  }

  @CreateRequestContext()
  public async loginUser(input: LoginUserInput) {
    return loginUser(this.em, input);
  }
}
