import { e2eUsers } from "@repo/util-e2e";

import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";
import { User } from "#database/entities/user.entity.ts";

import { e2eBaselineScenario } from "./e2e-baseline.scenario.ts";

it("seeds an admin, a manager and a regular user", async ({ em, orm }) => {
  await e2eBaselineScenario.seed(em);

  const users = await orm.em.fork().find(User, {});
  const byUsername = new Map(users.map((user) => [user.name, user]));

  expect(byUsername.get(e2eUsers.admin.username)?.role).toBe("admin");
  expect(byUsername.get(e2eUsers.manager.username)?.role).toBe("manager");
  expect(byUsername.get(e2eUsers.user.username)?.role).toBe("user");
});

it("has no environment data, so it can run in test mode", () => {
  expect(e2eBaselineScenario.environmentData).toBeUndefined();
});

it("can seed an empty database more than once", async ({ em, orm }) => {
  await e2eBaselineScenario.seed(em);
  await orm.schema.clear();
  await e2eBaselineScenario.seed(em.fork());

  await expect(orm.em.fork().count(User)).resolves.toBe(3);
});
