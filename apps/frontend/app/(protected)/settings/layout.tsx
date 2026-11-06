import { unauthorized } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";

import { SettingsLayout as SettingsLayoutClient } from "./layout.client";

export default async function SettingsLayout({
  children,
}: LayoutProps<"/settings">) {
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

  return <SettingsLayoutClient>{children}</SettingsLayoutClient>;
}
