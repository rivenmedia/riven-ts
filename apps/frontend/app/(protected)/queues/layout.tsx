import { notFound, unauthorized } from "next/navigation";

import { authClient } from "#lib/auth/client.ts";
import { isFeatureEnabled } from "#lib/enabled-features.ts";

export default async function QueuesLayout({
  children,
}: LayoutProps<"/queues">) {
  if (!isFeatureEnabled("queuesPage")) {
    notFound();
  }

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

  return children;
}
