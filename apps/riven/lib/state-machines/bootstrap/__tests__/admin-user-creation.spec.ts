import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { initialiseDatabaseConnection } from "#state-machines/bootstrap/actors/initialise-database-connection.actor.ts";
import * as settingsModule from "#utilities/settings.ts";

import { it } from "./helpers/test-context.ts";

// Use the real database connection actor, as it determines whether an admin user needs to be created.
// The ORM is already initialised against the in-memory test database, so this reuses that connection.
it.override({
  initialiseDatabaseConnectionActorLogic: initialiseDatabaseConnection,
});

it("creates an admin user if admin user credentials are provided and no existing admin user exists", async ({
  actor,
  services,
}) => {
  const adminUserCredentials = {
    username: "test-admin",
    password: "test-password",
  };

  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    adminUserCredentials,
  });

  vi.spyOn(services.authService, "hasExistingAdminUser").mockResolvedValue(
    false,
  );

  const createAdminUserSpy = vi
    .spyOn(services.authService, "createAdminUser")
    .mockResolvedValue(undefined);

  await toPromise(actor.start());

  expect(createAdminUserSpy).toHaveBeenCalledExactlyOnceWith(
    adminUserCredentials,
  );
});

it("does not create an admin user if admin user credentials are not provided", async ({
  actor,
  services,
}) => {
  vi.spyOn(settingsModule, "settings", "get").mockReturnValue({
    ...settingsModule.settings,
    adminUserCredentials: null,
  });

  vi.spyOn(services.authService, "hasExistingAdminUser").mockResolvedValue(
    false,
  );

  const createAdminUserSpy = vi.spyOn(services.authService, "createAdminUser");

  await toPromise(actor.start());

  expect(createAdminUserSpy).not.toHaveBeenCalled();
});

it("does not create an admin user if an existing admin user already exists", async ({
  actor,
  services,
}) => {
  vi.spyOn(services.authService, "hasExistingAdminUser").mockResolvedValue(
    true,
  );

  const createAdminUserSpy = vi.spyOn(services.authService, "createAdminUser");

  await toPromise(actor.start());

  expect(createAdminUserSpy).not.toHaveBeenCalled();
});
