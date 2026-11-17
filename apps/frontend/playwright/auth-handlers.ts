import { admin, manager, user, UserRole } from "@repo/util-auth/access-control";

import { getSessionCookie } from "better-auth/cookies";
import { HttpResponse, http } from "msw";

import { PermissionMetadata } from "#lib/server-actions/middlewares/check-permission.middleware.ts";

import type { Session } from "better-auth";
import type { UserWithRole } from "better-auth/client/plugins";

export const AUTH_COOKIE_PREFIX = "riven";

/**
 * A test-only cookie holding the signed-in user's role,
 * so the mocked backend can answer session and permission checks for that role.
 */
export const USER_ROLE_COOKIE = "e2e-user-role";

const roles = { admin, manager, user } as const;

const getSignedInRole = (request: Request, cookies: Record<string, string>) => {
  if (!getSessionCookie(request, { cookiePrefix: AUTH_COOKIE_PREFIX })) {
    return null;
  }

  return UserRole.safeParse(cookies[USER_ROLE_COOKIE]).data ?? null;
};

export const createGetSessionHandler = (
  session: Session,
  baseUser: UserWithRole,
) =>
  http.get("**/api/auth/get-session", ({ request, cookies }) => {
    const role = getSignedInRole(request, cookies);

    if (!role) {
      return HttpResponse.json(null);
    }

    return HttpResponse.json({ session, user: { ...baseUser, role } });
  });

/** Answers permission checks from the signed-in user's role, using the same access control as the backend */
export const hasPermissionHandler = http.post(
  "**/api/auth/admin/has-permission",
  async ({ request, cookies }) => {
    const role = getSignedInRole(request, cookies);

    if (!role) {
      return HttpResponse.json({ success: false }, { status: 401 });
    }

    const { permissions } = PermissionMetadata.parse(await request.json());

    // `authorize` doesn't accept explicitly `undefined` permission groups
    const requestedPermissions: Parameters<
      (typeof roles)[UserRole]["authorize"]
    >[0] = Object.fromEntries(
      Object.entries(permissions).filter(([, actions]) => actions),
    );

    return HttpResponse.json({
      success: roles[role].authorize(requestedPermissions).success,
    });
  },
);

/** No passkeys are registered, so the login page's passkey autofill has nothing to offer */
export const passkeysUnavailableHandler = http.get(
  "**/api/auth/passkey/generate-authenticate-options",
  () => HttpResponse.json(null, { status: 404 }),
);
