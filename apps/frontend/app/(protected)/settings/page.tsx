import { unauthorized } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";

import { SettingsPage as SettingsPageClient } from "./page.client";

export default async function SettingsPage() {
  const authData = await authClient.getSession({
    fetchOptions: {
      throw: true,
    },
  });

  if (!authData?.user) {
    unauthorized();
  }

  const { data: canManageSettings } = await authClient.admin.hasPermission({
    permissions: { instance: ["manage-settings"] },
    userId: authData.user.id,
  });

  if (!canManageSettings?.success) {
    unauthorized();
  }

  return <SettingsPageClient canManageSettings />;
}
