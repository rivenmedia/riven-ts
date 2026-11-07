import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import z from "zod";

export const ItemPermission = z.enum([
  "request",
  "delete",
  "reset",
  "pause",
  "resume",
  "retry",
  "scrape",
]);

export const LibraryPermission = z.enum(["reset"]);

export const InstancePermission = z.enum(["manage-settings"]);

export const UserPermission = z.enum([...defaultStatements.user]);

export const SessionPermission = z.enum([...defaultStatements.session]);

const statement = {
  ...defaultStatements,
  item: ItemPermission.options,
  library: LibraryPermission.options,
  instance: InstancePermission.options,
} as const;

export const ac = createAccessControl(statement);

export type Permissions = {
  readonly [Resource in keyof typeof statement]?: readonly (typeof statement)[Resource][number][];
};

export const admin = ac.newRole({
  item: ItemPermission.options,
  library: LibraryPermission.options,
  instance: InstancePermission.options,
  ...adminAc.statements,
});

export const user = ac.newRole({
  user: ["set-email", "set-password"],
  item: [ItemPermission.enum.request],
  session: [],
  instance: [],
  library: [],
});

export const manager = ac.newRole({
  user: ["set-email", "set-password"],
  item: ItemPermission.options,
  session: [],
  instance: [],
  library: [],
});

export const UserRole = z.enum(["user", "manager", "admin"]);

export type UserRole = z.infer<typeof UserRole>;

export const roles = { admin, manager, user } satisfies Record<
  UserRole,
  unknown
>;

/**
 * Whether any role in `role` grants every action in `permissions`.
 *
 * Like better-auth's admin plugin, `role` may list several comma-separated roles.
 * An unknown or missing role grants nothing.
 */
export function roleHasPermissions(
  role: string | null | undefined,
  permissions: Permissions,
) {
  return (role ?? "").split(",").some((name) => {
    const parsed = UserRole.safeParse(name);

    return parsed.success && roles[parsed.data].authorize(permissions).success;
  });
}
