import { authClient } from "@/lib/auth/client";

import { ItemPermission } from "@repo/util-auth/access-control";

import { createMiddleware } from "next-safe-action";
import { unauthorized } from "next/navigation";
import z from "zod";

export const PermissionMetadata = z.object({
  permissions: z.object({
    item: z.array(ItemPermission),
  }),
});

export const checkPermissionMiddleware = createMiddleware<{
  metadata: z.infer<typeof PermissionMetadata>;
}>().define(async ({ metadata, next }) => {
  const { data } = await authClient.admin.hasPermission({
    permissions: metadata.permissions,
  });

  if (!data?.success) {
    return unauthorized();
  }

  return next();
});
