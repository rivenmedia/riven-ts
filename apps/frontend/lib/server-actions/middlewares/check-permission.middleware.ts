import { ItemPermission } from "@repo/util-auth/access-control";

import { createMiddleware } from "next-safe-action";
import z from "zod";

import { authClient } from "@/lib/auth/client";

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
    throw new Error("User does not have the required permissions");
  }

  return next();
});
