import { expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { Session, User } from "../../../entities/index.ts";

it("logs in a user with valid credentials", async ({ services, em }) => {
  await services.userService.registerUser({
    username: "admin",
    email: "admin@example.com",
    password: "admin",
  });

  const username = "testuser";
  const password = "password123";

  await services.userService.registerUser({
    username,
    email: "testuser@example.com",
    password,
  });

  const user = await em.findOneOrFail(User, { username });

  user.sessions.removeAll();

  await em.flush();

  const getSessionCount = () => em.count(Session, { user: user.id });

  await expect(getSessionCount()).resolves.toBe(0);

  await services.userService.loginUser({ username, password });

  await expect(getSessionCount()).resolves.toBe(1);
});

it("throws an error when provided invalid credentials", async ({
  services,
}) => {
  await services.userService.registerUser({
    username: "admin",
    email: "admin@example.com",
    password: "admin",
  });

  await expect(
    services.userService.loginUser({
      username: "admin",
      password: "wrongpassword",
    }),
  ).rejects.toThrow(/invalid username or password/i);
});
