import { http, HttpResponse } from "msw";

import { PermissionMetadata } from "#lib/server-actions/middlewares/check-permission.middleware.ts";

export const createHasPermissionHandler = (
  providedPermissions: PermissionMetadata["permissions"],
) =>
  http.post("**/api/auth/admin/has-permission", async ({ request }) => {
    const body = PermissionMetadata.safeParse(await request.json());

    if (!body.success) {
      throw new Error("Invalid request body");
    }

    const { permissions } = body.data;

    for (const [key, permissionGroup = []] of Object.entries(permissions)) {
      for (const permission of permissionGroup) {
        const providedGroup =
          providedPermissions[key as keyof PermissionMetadata["permissions"]];

        if (!providedGroup?.includes(permission as never)) {
          return HttpResponse.json({ success: false });
        }
      }
    }

    return HttpResponse.json({ success: true });
  });
