import { expect, onTestFinished, vi } from "vitest";
import { fromPromise, toPromise } from "xstate";

import { it } from "./helpers/test-context.ts";

import type {
  InitialiseVfsInput,
  InitialiseVfsOutput,
} from "#state-machines/bootstrap/actors/initialise-vfs.actor.ts";

// Mounting fails the bootstrap, so a bootstrap that completes didn't mount
it.override({
  initialiseVfsActorLogic: fromPromise<InitialiseVfsOutput, InitialiseVfsInput>(
    () => Promise.reject(new Error("The VFS was mounted")),
  ),
});

const stubEnvironment = (environment: Record<string, string>) => {
  onTestFinished(() => {
    vi.unstubAllEnvs();
  });

  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }
};

it("skips mounting the VFS in test mode when E2E_SKIP_VFS_MOUNT is set", async ({
  actor,
}) => {
  stubEnvironment({
    NODE_ENV: "test",
    MOCK_SCENARIO: "e2e-baseline",
    E2E_SKIP_VFS_MOUNT: "true",
  });

  const output = await toPromise(actor.start());

  expect(output.vfs).toBeUndefined();
});

it("mounts the VFS outside test mode, even when E2E_SKIP_VFS_MOUNT is set", async ({
  actor,
}) => {
  stubEnvironment({
    NODE_ENV: "test",
    MOCK_SCENARIO: "",
    E2E_SKIP_VFS_MOUNT: "true",
  });

  await expect(toPromise(actor.start())).rejects.toThrow("The VFS was mounted");
});

it("mounts the VFS in test mode when E2E_SKIP_VFS_MOUNT isn't set", async ({
  actor,
}) => {
  stubEnvironment({ NODE_ENV: "test", MOCK_SCENARIO: "e2e-baseline" });

  await expect(toPromise(actor.start())).rejects.toThrow("The VFS was mounted");
});
