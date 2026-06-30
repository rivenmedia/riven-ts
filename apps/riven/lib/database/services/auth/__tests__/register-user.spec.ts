import { expect, vi } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import * as getAuthProvidersModule from "../../../../auth/get-auth-providers.ts";
import { User } from "../../../entities/index.ts";

it("allows signup for the first user even if sign-up is disabled", async ({
  services,
}) => {
  vi.spyOn(getAuthProvidersModule, "getAuthProviders").mockReturnValue({});

  await expect(
    services.userService.registerUser({
      username: "firstuser",
      email: "firstuser@example.com",
      password: "password123",
    }),
  ).resolves.not.toThrow();
});

it("does not allow signup if sign-up is disabled and another user already exists", async ({
  authHelpers,
  services,
}) => {
  vi.spyOn(getAuthProvidersModule, "getAuthProviders").mockReturnValue({});

  await authHelpers.saveUser(authHelpers.createUser());

  await expect(
    services.userService.registerUser({
      username: "firstuser",
      email: "firstuser@example.com",
      password: "password123",
    }),
  ).rejects.toThrow(/registration is disabled/i);
});

it("registers an admin account when the first user is registered", async ({
  services,
  em,
}) => {
  const email = "firstuser@example.com";

  await services.userService.registerUser({
    username: "firstuser",
    email,
    password: "password123",
  });

  const user = await em.findOneOrFail(User, { email });

  expect(user.role).toBe("admin");
});

it("registers a user with no elevated permissions after the first user has been registered", async ({
  authHelpers,
  services,
  em,
}) => {
  await authHelpers.saveUser(authHelpers.createUser());

  const email = "seconduser@example.com";

  await services.userService.registerUser({
    username: "",
    email,
    password: "password123",
  });

  const user = await em.findOneOrFail(User, { email });

  expect(user.role).toBe("user");
});

it("throws an error if the email is already registered", async ({
  authHelpers,
  services,
}) => {
  const email = "email@example.com";

  await authHelpers.saveUser(authHelpers.createUser({ email }));

  await expect(
    services.userService.registerUser({
      username: "newuser",
      email,
      password: "password123",
    }),
  ).rejects.toThrow(/use another email/i);
});
