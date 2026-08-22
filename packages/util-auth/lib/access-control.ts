import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";
import z from "zod";

export const ItemPermission = z.enum([
  "request",
  "delete",
  "reset",
  "pause",
  "retry",
  "scrape",
]);

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
  item: [ItemPermission.enum.request],
});

export const manager = ac.newRole({
  item: ItemPermission.options,
});
