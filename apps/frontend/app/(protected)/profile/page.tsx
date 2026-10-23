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

  const [{ data: canManageUsers }, { data: authProvidersData }] =
    await Promise.all([
      authClient.admin.hasPermission({
        permissions: { user: ["create"] },
        userId: authData.user.id,
      }),
      query({
        query: GET_AUTH_PROVIDERS,
      }),
    ]);

  const hasCredentialProvider = Boolean(
    authProvidersData?.authProviders.some(
      (provider) => provider.key === "credential",
    ),
  );

  return (
    <ProfilePageClient
      canManageUsers={canManageUsers?.success ?? false}
      hasCredentialProvider={hasCredentialProvider}
      user={authData.user}
    />
  );
}
