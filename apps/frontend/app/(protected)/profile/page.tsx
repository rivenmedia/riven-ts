import { unauthorized } from "next/navigation";

import { GET_AUTH_PROVIDERS } from "#app/(public)/login/_queries/get-auth-providers.query.ts";
import { authClient } from "#lib/auth/client.ts";
import { query } from "#lib/graphql/client.ts";

import { ProfilePage as ProfilePageClient } from "./page.client";

export default async function ProfilePage() {
  const authData = await authClient.getSession({
    fetchOptions: {
      throw: true,
    },
  });

  if (!authData?.user) {
    unauthorized();
  }

  const [
    { data: canManageUsers },
    { data: canListUsers },
    { data: accounts },
    { data: authProvidersData },
  ] = await Promise.all([
    authClient.admin.hasPermission({
      permissions: { user: ["create"] },
      userId: authData.user.id,
    }),
    authClient.admin.hasPermission({
      permissions: { user: ["list"] },
      userId: authData.user.id,
    }),
    authClient.listAccounts(),
    query({
      query: GET_AUTH_PROVIDERS,
    }),
  ]);

  const { users } = canListUsers?.success
    ? await authClient.admin.listUsers({
        query: {},
        fetchOptions: {
          throw: true,
        },
      })
    : { users: [] };

  const hasCredentialProvider = Boolean(
    authProvidersData?.authProviders.some(
      (provider) => provider.key === "credential",
    ),
  );

  const providers = new Map(
    (authProvidersData?.authProviders ?? []).map((provider) => [
      provider.key,
      provider,
    ]),
  );

  return (
    <ProfilePageClient
      canManageUsers={canManageUsers?.success ?? false}
      hasCredentialProvider={hasCredentialProvider}
      user={authData.user}
      users={users}
      accounts={accounts ?? []}
      providers={Object.fromEntries(providers)}
    />
  );
}
