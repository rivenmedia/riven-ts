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

export const UserPermission = z.enum([...defaultStatements.user]);

export const SessionPermission = z.enum([...defaultStatements.session]);

const statement = {
  ...defaultStatements,
  item: ItemPermission.options,
} as const;

export const ac = createAccessControl(statement);

export const admin = ac.newRole({
  item: ItemPermission.options,
  ...adminAc.statements,
});

export const user = ac.newRole({
  session: [],
  user: ["set-email", "set-password"],
  item: [ItemPermission.enum.request],
});

export const manager = ac.newRole({
  session: [],
  user: ["set-email", "set-password"],
  item: ItemPermission.options,
});

export const UserRole = z.enum(["user", "manager", "admin"]);

export type UserRole = z.infer<typeof UserRole>;
