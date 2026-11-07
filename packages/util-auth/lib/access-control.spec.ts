import { expect, it } from "vitest";

import { roleHasPermissions } from "./access-control.ts";

import type { Permissions } from "./access-control.ts";

it.for<[string | null | undefined, Permissions, boolean]>([
  [
    "admin",
    {
      item: [
        "request",
        "delete",
        "reset",
        "pause",
        "resume",
        "retry",
        "scrape",
      ],
    },
    true,
  ],
  ["admin", { library: ["reset"] }, true],
  ["admin", { instance: ["manage-settings"] }, true],
  ["admin", { user: ["ban", "set-role"] }, true],
  ["admin", { session: ["revoke"] }, true],
  [
    "admin",
    { item: ["delete"], library: ["reset"], instance: ["manage-settings"] },
    true,
  ],
  [
    "manager",
    {
      item: [
        "request",
        "delete",
        "reset",
        "pause",
        "resume",
        "retry",
        "scrape",
      ],
    },
    true,
  ],
  ["manager", { library: ["reset"] }, false],
  ["manager", { instance: ["manage-settings"] }, false],
  ["manager", { user: ["set-email", "set-password"] }, true],
  ["manager", { user: ["ban"] }, false],
  ["manager", { session: ["revoke"] }, false],
  ["manager", { item: ["delete"], instance: ["manage-settings"] }, false],
  ["user", { item: ["request"] }, true],
  ["user", { item: ["delete"] }, false],
  ["user", { item: ["request", "delete"] }, false],
  ["user", { library: ["reset"] }, false],
  ["user", { instance: ["manage-settings"] }, false],
  ["user", { user: ["set-email", "set-password"] }, true],
  ["user", { user: ["list"] }, false],
  ["user", { session: ["list"] }, false],
  ["user,manager", { item: ["delete"] }, true],
  ["user,manager", { instance: ["manage-settings"] }, false],
  ["user,admin", { instance: ["manage-settings"] }, true],
  ["guest", { item: ["request"] }, false],
  ["guest,user", { item: ["request"] }, true],
  ["", { item: ["request"] }, false],
  [null, { item: ["request"] }, false],
  [undefined, { item: ["request"] }, false],
])("roleHasPermissions(%j, %j) is %s", ([role, permissions, expected]) => {
  expect(roleHasPermissions(role, permissions)).toBe(expected);
});

it("roleHasPermissions rejects an action that no resource defines", () => {
  // @ts-expect-error - "delet" is not an item action.
  expect(roleHasPermissions("admin", { item: ["delet"] })).toBe(false);
});
