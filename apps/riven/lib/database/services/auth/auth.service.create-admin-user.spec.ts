import { APIError } from "better-auth/api";
import { expect, vi } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";
import { User } from "#database/entities/user.entity.ts";

const it = baseIt.extend("auth", ({ orm }) => initAuth(orm));

it("creates an admin user that can sign in with their username", async ({
  auth,
  em,
  services: { authService },
}) => {
  const signIn = vi.spyOn(auth.api, "signInUsername");

  await expect(authService.hasExistingAdminUser()).resolves.toBe(false);

  await authService.createAdminUser({
    username: "admin",
    password: "correct horse battery staple",
  });

  await expect(authService.hasExistingAdminUser()).resolves.toBe(true);

  const admin = await em.findOneOrFail(User, { role: "admin" });

  expect(admin).toMatchObject({ name: "admin", username: "admin" });

  await expect(signIn.mock.results[0]?.value).resolves.toMatchObject({
    user: { id: admin.id },
  });
});

it("rethrows authentication errors", async ({ services: { authService } }) => {
  const input = { username: "admin", password: "correct horse battery staple" };

  await authService.createAdminUser(input);

  await expect(authService.createAdminUser(input)).rejects.toBeInstanceOf(
    APIError,
  );
});

it("wraps unexpected errors", async ({ auth, services: { authService } }) => {
  const cause = new Error("Database unavailable");

  vi.spyOn(auth.api, "createUser").mockRejectedValue(cause);

  await expect(
    authService.createAdminUser({
      username: "admin",
      password: "correct horse battery staple",
    }),
  ).rejects.toMatchObject({
    message: "An unexpected error occurred during login",
    cause,
  });

  await expect(authService.hasExistingAdminUser()).resolves.toBe(false);
});
