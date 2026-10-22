import { Query, Resolver } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

import { AuthProvider } from "./types/auth-provider.type.ts";

@Resolver()
export class AuthResolver {
  @Query(() => [AuthProvider])
  public authProviders(@CoreContext() { services }: CoreContext) {
    return services.authService.getAvailableAuthProviders();
  }
}
