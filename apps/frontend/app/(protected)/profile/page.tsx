import { unauthorized } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";

import { ProfilePage as ProfilePageClient } from "./page.client";

export default async function ProfilePage() {
  const session = await authClient.getSession({
    fetchOptions: {
      throw: true,
    },
  });

  if (!session?.user) {
    unauthorized();
  }

  return (
    <ProfilePageClient
      canManageUsers
      hasCredentialProvider
      user={session.user}
    />
  );
}
