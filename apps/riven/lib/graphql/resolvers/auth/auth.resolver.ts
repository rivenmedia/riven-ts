import { Query, Resolver } from "type-graphql";

import { frontendSettings } from "#utilities/frontend-settings.ts";

import { AuthProvider } from "./types/auth-provider.type.ts";

@Resolver()
export class AuthResolver {
  @Query(() => [AuthProvider])
  public authProviders() {
    const authProviders: AuthProvider[] = [];

    if (frontendSettings.enableEmailPasswordSignup) {
      authProviders.push({
        key: "credential",
        enabled: true,
        disableSignup: false,
      });
    }

    return authProviders;
  }
}
