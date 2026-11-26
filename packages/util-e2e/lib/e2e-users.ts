import type { UserRole } from "@repo/util-auth/access-control";

interface E2eUser {
  username: string;
  password: string;
  email: string;
}

/**
 * The users the `e2e-baseline` scenario seeds.
 * Usernames can't contain hyphens, as Better Auth only allows letters, digits, `_` and `.`.
 */
export const e2eUsers = {
  admin: {
    username: "e2e_admin",
    password: "e2e-admin-password",
    email: "e2e-admin@riven.invalid",
  },
  user: {
    username: "e2e_user",
    password: "e2e-user-password",
    email: "e2e-user@riven.invalid",
  },
  manager: {
    username: "e2e_manager",
    password: "e2e-manager-password",
    email: "e2e-manager@riven.invalid",
  },
} as const satisfies Record<UserRole, E2eUser>;
