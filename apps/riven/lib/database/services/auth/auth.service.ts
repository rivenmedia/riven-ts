import { CreateRequestContext } from "@mikro-orm/decorators/legacy";

import { getAuthProviders } from "#auth/get-auth-providers.ts";
import { User } from "#database/entities/user.entity.ts";
import { BaseService } from "#database/services/core/base-service.ts";

import { createAdminUser } from "./utilities/create-admin-user.ts";

import type { AuthProvider } from "#auth/get-auth-providers.ts";
import type { CreateAdminUserInput } from "./utilities/create-admin-user.ts";

export class AuthService extends BaseService {
  @CreateRequestContext()
  public async createAdminUser(input: CreateAdminUserInput) {
    return createAdminUser(input);
  }

  public getAvailableAuthProviders(): AuthProvider[] {
    return [...getAuthProviders().values()];
  }

  @CreateRequestContext()
  public async hasExistingAdminUser() {
    const adminCount = await this.em.count(User, { role: "admin" });

    return adminCount > 0;
  }
}
